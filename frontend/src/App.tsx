import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';

// Context
import { AppCtx } from './context/AppContext';

// Data & Helpers
import { COLLECTION_SEED, ARTWORKS, ORDERS, AUTH_SCREENS, EXPORT_FRAMES } from './data/mockData';
import { toast } from './utils/helpers';
import { Artwork, Order, Collection, Notification, Comment, Profile, ConfirmSpec, AppOverlay, AppContextType } from './types';
import { AuthUser, clearToken, fetchMe, getToken, logoutUser } from './services/api';

// UI & Layout Components
import { Toaster } from './components/ui/Toast';
import { Sidebar } from './components/layout/Sidebar';
import { TopCluster } from './components/layout/TopNav';
import { MobileTopBar } from './components/layout/MobileTopBar';
import { MobileNav } from './components/layout/MobileNav';
import { Footer } from './components/layout/Footer';
import { DevBar } from './components/layout/DevBar';
import { AnnotationLayer } from './components/layout/AnnotationLayer';

// Modals & Overlays
import {
  LoginModal,
  NotifDropdown,
  AvatarMenu,
  CollectionsPopover,
  SharePopover,
  MoreMenu,
  Lightbox,
  SubmitModal,
  ParticipantsModal,
  ConfirmDialog
} from './components/modals';

// Pages
import {
  DiscoveryPage,
  RankingPage,
  CommissionPage,
  OrderPage,
  ContestPage,
  ArtworkDetailPage,
  ProfilePage,
  FavoritesPage,
  CollectionsPage,
  CollectionDetailPage,
  SearchPage,
  CategoryPage,
  SettingsPage,
  UploadPage,
  WatermarkPage,
  AboutPage
} from './pages';

// Auth Pages
import {
  LoginPage,
  SignupPage,
  ForgotPasswordPage,
  CheckEmailPage,
  ResetPasswordPage,
  OnboardingPage
} from './pages/auth';

const DEEP_LINK = (() => {
  try {
    const q = new URLSearchParams(location.search + "&" + location.hash.replace(/^#/, ""));
    const screen = q.get("screen");
    return { screen: screen || "discovery", auth: q.get("auth") !== "out" && !AUTH_SCREENS.includes(screen || "") };
  } catch (e) { return { screen: "discovery", auth: true }; }
})();

// Route mapping helper
const navigateToPath = (screen: string, params: any = {}) => {
  switch (screen) {
    case "discovery":
      return "/";
    case "ranking":
      return "/ranking";
    case "commission":
      if (params?.artistId) {
        return `/commission?artistId=${params.artistId}`;
      }
      return "/commission";
    case "contest":
      return "/contest";
    case "order":
      if (params?.order) {
        return `/order/${params.order.id || params.order}`;
      }
      return "/order";
    case "upload":
      return "/upload";
    case "watermark":
      return "/watermark";
    case "favorites":
      return "/favorites";
    case "collections":
      return "/collections";
    case "collection":
      if (params?.collection) {
        return `/collection/${params.collection.id || params.collection}`;
      }
      return "/collections";
    case "search":
      if (params?.q) {
        return `/search?q=${encodeURIComponent(params.q)}`;
      }
      return "/search";
    case "category":
      if (params?.category) {
        return `/category/${encodeURIComponent(params.category)}`;
      }
      return "/";
    case "settings":
      return "/settings";
    case "profile":
      return "/profile";
    case "about":
      return "/about";
    case "artwork":
      if (params?.artwork) {
        return `/artwork/${params.artwork.id || params.artwork}`;
      }
      return "/";
    case "login":
      return "/login";
    case "signup":
      return "/signup";
    case "forgot":
      return "/forgot";
    case "checkEmail":
      if (params?.email) {
        return `/check-email?email=${encodeURIComponent(params.email)}`;
      }
      return "/check-email";
    case "reset":
      return "/reset-password";
    case "onboarding":
      return "/onboarding";
    default:
      return "/";
  }
};

function ExportAll() {
  return (
    <div style={{ background: "#FFFFFF" }}>
      <style>{".av-frame aside{height:100% !important}.av-frame .av-mobilenav,.av-frame .md\\:hidden{display:none !important}"}</style>
      {EXPORT_FRAMES.map(([label, screen, params, auth]) => (
        <div key={label as string} style={{ width: 1440, margin: "0 auto 96px" }}>
          <p style={{ font: "700 13px 'Plus Jakarta Sans', system-ui", color: "#A1A1AA", padding: "0 0 10px", letterSpacing: "0.04em" }}>{label as string}</p>
          <div className="av-frame" style={{ position: "relative", transform: "translate(0,0)", border: "1px solid #E5E5E7", overflow: "hidden", background: "#FFFFFF" }}>
            <App screen0={screen as string} params0={params} auth0={auth as boolean} exportMode />
          </div>
        </div>
      ))}
    </div>
  );
}

function ArtworkDetailPageWrapper() {
  const { id } = useParams<{ id: string }>();
  const artworkObj = ARTWORKS.find(a => a.id === Number(id)) || ARTWORKS[0];
  return <ArtworkDetailPage artwork={artworkObj} />;
}

export function App(props: { screen0?: string; params0?: any; auth0?: boolean; exportMode?: boolean } = {}) {
  // If static mode (e.g. inside ExportAll), use local state; otherwise, react router
  const isStatic = props.screen0 !== undefined;
  
  const navigate = !isStatic ? useNavigate() : null;
  const location = !isStatic ? useLocation() : null;

  const [staticView, setStaticView] = useState({
    screen: props.screen0 || DEEP_LINK.screen,
    params: props.params0 || {}
  });

  const [stack, setStack] = useState<any[]>([]);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [collections, setCollections] = useState<Collection[]>(COLLECTION_SEED);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loggedIn, setLoggedIn] = useState(isStatic ? Boolean(props.auth0) : false);
  const [viewState, setViewState] = useState("normal");
  const [annotate, setAnnotate] = useState(false);
  const [overlay, setOverlay] = useState<AppOverlay | null>(null);
  const pending = useRef<(() => void) | null>(null);
  const restore = useRef<number | null>(null);

  useEffect(() => {
    const token = getToken();

    if (isStatic || !token) return;

    let active = true;
    fetchMe().then(user => {
      if (!active) return;

      if (user) {
        setCurrentUser(user);
        setLoggedIn(true);
        return;
      }

      setCurrentUser(null);
      setLoggedIn(false);
    });

    return () => {
      active = false;
    };
  }, [isStatic, props.auth0]);

  // Match URL path to screen/params for backwards compatibility context
  const matchRouteToScreen = useCallback((pathname: string, search: string) => {
    const searchParams = new URLSearchParams(search);
    
    if (pathname === "/" || pathname === "/discovery") {
      return { screen: "discovery", params: {} };
    }
    if (pathname === "/ranking") {
      return { screen: "ranking", params: {} };
    }
    if (pathname === "/commission") {
      return { screen: "commission", params: { artistId: searchParams.get("artistId") } };
    }
    if (pathname === "/contest") {
      return { screen: "contest", params: {} };
    }
    if (pathname.startsWith("/order/")) {
      const orderId = pathname.split("/order/")[1];
      const orderObj = ORDERS.find(o => o.id === orderId) || ORDERS[0];
      return { screen: "order", params: { order: orderObj } };
    }
    if (pathname === "/upload") {
      return { screen: "upload", params: {} };
    }
    if (pathname === "/watermark") {
      return { screen: "watermark", params: {} };
    }
    if (pathname === "/favorites") {
      return { screen: "favorites", params: {} };
    }
    if (pathname === "/collections") {
      return { screen: "collections", params: {} };
    }
    if (pathname.startsWith("/collection/")) {
      const collectionId = pathname.split("/collection/")[1];
      const colObj = collections.find(c => c.id === collectionId) || collections[0];
      return { screen: "collection", params: { collection: colObj } };
    }
    if (pathname === "/search") {
      return { screen: "search", params: { q: searchParams.get("q") || "" } };
    }
    if (pathname.startsWith("/category/")) {
      const catName = decodeURIComponent(pathname.split("/category/")[1]);
      return { screen: "category", params: { category: catName } };
    }
    if (pathname === "/settings") {
      return { screen: "settings", params: {} };
    }
    if (pathname === "/profile") {
      return { screen: "profile", params: {} };
    }
    if (pathname === "/about") {
      return { screen: "about", params: {} };
    }
    if (pathname.startsWith("/artwork/")) {
      const artworkId = Number(pathname.split("/artwork/")[1]);
      const artworkObj = ARTWORKS.find(a => a.id === artworkId) || ARTWORKS[0];
      return { screen: "artwork", params: { artwork: artworkObj } };
    }
    if (pathname === "/login") {
      return { screen: "login", params: {} };
    }
    if (pathname === "/signup") {
      return { screen: "signup", params: {} };
    }
    if (pathname === "/forgot") {
      return { screen: "forgot", params: {} };
    }
    if (pathname === "/check-email") {
      return { screen: "checkEmail", params: { email: searchParams.get("email") || "nama@email.com" } };
    }
    if (pathname === "/reset-password") {
      return { screen: "reset", params: {} };
    }
    if (pathname === "/onboarding") {
      return { screen: "onboarding", params: {} };
    }
    return { screen: "discovery", params: {} };
  }, [collections]);

  // Derived current view state
  const currentView = useMemo(() => {
    if (isStatic) {
      return staticView;
    }
    if (location) {
      return matchRouteToScreen(location.pathname, location.search);
    }
    return { screen: "discovery", params: {} };
  }, [isStatic, staticView, location, matchRouteToScreen]);

  const screen = currentView.screen;
  const params = currentView.params;

  // Scroll restore
  useEffect(() => {
    if (restore.current !== null) {
      const y = restore.current;
      restore.current = null;
      requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: y })));
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [location?.pathname, staticView]);

  const push = useCallback((targetScreen: string, targetParams: any = {}) => {
    if (isStatic) {
      setStack(s => [...s, { ...staticView, scroll: window.scrollY }]);
      setOverlay(null);
      setStaticView({ screen: targetScreen, params: targetParams });
    } else if (navigate) {
      const path = navigateToPath(targetScreen, targetParams);
      setOverlay(null);
      navigate(path);
    }
  }, [isStatic, staticView, navigate]);

  const back = useCallback(() => {
    if (isStatic) {
      setStack(s => {
        if (!s.length) { setStaticView({ screen: "discovery", params: {} }); return s; }
        const prev = s[s.length - 1];
        restore.current = prev.scroll;
        setStaticView({ screen: prev.screen, params: prev.params });
        return s.slice(0, -1);
      });
      setOverlay(null);
    } else if (navigate) {
      setOverlay(null);
      navigate(-1);
    }
  }, [isStatic, navigate]);

  const requireAuth = useCallback((fn: () => void) => {
    if (loggedIn) { fn(); return; }
    pending.current = fn;
    setOverlay({ kind: "login" });
  }, [loggedIn]);

  const app: AppContextType = {
    screen,
    params,
    viewState, liked, saved, followed, collections, loggedIn, currentUser,
    navigate: (s, p) => push(s, p),
    signIn: (user) => {
      setCurrentUser(user || null);
      setLoggedIn(true);
    },
    back, requireAuth,
    retry: () => setViewState("normal"),
    openArtwork: (a) => push("artwork", { artwork: a }),
    openProfile: () => push("profile"),
    openCommission: (p) => push("commission", p),
    openOrder: (o) => push("order", { order: o }),
    openSearch: (q) => push("search", { q }),
    openCategory: (c) => push("category", { category: c }),
    openCollection: (c) => push("collection", { collection: c }),
    toggleLike: (a) => {
      setLiked(s => {
        const n = new Set(s);
        n.has(a.id) ? n.delete(a.id) : n.add(a.id);
        toast.success(n.has(a.id) ? "Ditambahkan ke Favorit" : "Dihapus dari Favorit", { description: a.title });
        return n;
      });
    },
    toggleFollow: (id) => {
      setFollowed(s => {
        const n = new Set(s);
        n.has(id) ? n.delete(id) : n.add(id);
        toast.success(n.has(id) ? "Kamu mengikuti artist ini" : "Berhenti mengikuti");
        return n;
      });
    },
    saveTo: (c, a) => {
      setCollections(list => list.map(x => x.id === c.id ? { ...x, ids: x.ids.includes(a.id) ? x.ids : [...x.ids, a.id] } : x));
      setSaved(s => new Set(s).add(a.id));
      toast.success("Disimpan ke " + c.name, { description: a.title });
    },
    createCollection: (name, a) => {
      setCollections(list => [...list, { id: "c" + Date.now(), name, ids: [a.id] }]);
      setSaved(s => new Set(s).add(a.id));
      toast.success("Koleksi “" + name + "” dibuat", { description: a.title + " disimpan" });
    },
    logout: async () => {
      try {
        await logoutUser();
      } finally {
        clearToken();
        setCurrentUser(null);
        setLoggedIn(false);
        toast("Kamu telah keluar");
      }
    },
    confirm: (spec) => setOverlay({ kind: "confirm", spec }),
    openNotifs: (rect) => setOverlay({ kind: "notifs", rect }),
    openAvatarMenu: (rect) => setOverlay({ kind: "avatar", rect }),
    openCollections: (artwork, rect) => setOverlay({ kind: "collections", artwork, rect }),
    openShare: (artwork, rect) => setOverlay({ kind: "share", artwork, rect }),
    openMore: (artwork, rect) => setOverlay({ kind: "more", artwork, rect }),
    openLightbox: (artwork) => setOverlay({ kind: "lightbox", artwork }),
    openSubmit: () => setOverlay({ kind: "submit" }),
    openParticipants: () => setOverlay({ kind: "participants" }),
  };

  const closeOverlay = () => setOverlay(null);
  const closeLoginOverlay = () => {
    pending.current = null;
    closeOverlay();
  };
  const chrome = !props.exportMode;

  if (!props.screen0 && DEEP_LINK.screen === "all") return <ExportAll />;

  if (AUTH_SCREENS.includes(screen)) {
    return (
      <AppCtx.Provider value={app}>
        <div className={chrome ? "min-h-screen bg-white" : "bg-white"} style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}>
          {chrome && <Toaster />}
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot" element={<ForgotPasswordPage />} />
            <Route path="/check-email" element={<CheckEmailPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="*" element={<LoginPage />} />
          </Routes>
          <AnnotationLayer on={annotate} />
          {chrome && <DevBar value={viewState} onChange={setViewState} annotate={annotate} onAnnotate={setAnnotate} />}
        </div>
      </AppCtx.Provider>
    );
  }

  return (
    <AppCtx.Provider value={app}>
      <div className={chrome ? "min-h-screen bg-white" : "bg-white"} style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}>
        {chrome && <Toaster />}

        <div className="hidden md:block"><Sidebar /></div>
        <MobileTopBar />

        <main className={"md:ml-60 pt-12 md:pt-0 pb-16 md:pb-0 flex flex-col " + (chrome ? "min-h-screen" : "")}>
          <div className="flex-1">
            {!["artwork", "upload", "watermark"].includes(screen) && <TopCluster />}
            <Routes>
              <Route path="/" element={<DiscoveryPage />} />
              <Route path="/discovery" element={<DiscoveryPage />} />
              <Route path="/ranking" element={<RankingPage />} />
              <Route path="/commission" element={<CommissionPage />} />
              <Route path="/contest" element={<ContestPage />} />
              <Route path="/order/:id" element={<OrderPage />} />
              <Route path="/order" element={<OrderPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/watermark" element={<WatermarkPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/collections" element={<CollectionsPage />} />
              <Route path="/collection/:id" element={<CollectionDetailPage />} />
              <Route path="/collection" element={<CollectionDetailPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/category/:category" element={<CategoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/about" element={<AboutPage navigate={app.navigate} />} />
              <Route path="/artwork/:id" element={<ArtworkDetailPageWrapper />} />
              <Route path="/artwork" element={<ArtworkDetailPageWrapper />} />
              <Route path="*" element={<DiscoveryPage />} />
            </Routes>
          </div>
          <Footer navigate={app.navigate} />
        </main>

        <MobileNav />

        {overlay && overlay.kind === "login"        && <LoginModal onClose={closeLoginOverlay} onDone={(user) => { app.signIn(user); closeOverlay(); const fn = pending.current; pending.current = null; toast.success("Berhasil masuk", { description: fn ? "Tindakanmu dilanjutkan" : undefined }); if (fn) setTimeout(fn, 60); }} />}
        {overlay && overlay.kind === "notifs"       && <NotifDropdown rect={overlay.rect!} onClose={closeOverlay} />}
        {overlay && overlay.kind === "avatar"       && <AvatarMenu rect={overlay.rect!} onClose={closeOverlay} />}
        {overlay && overlay.kind === "collections"  && <CollectionsPopover rect={overlay.rect!} artwork={overlay.artwork!} onClose={closeOverlay} />}
        {overlay && overlay.kind === "share"        && <SharePopover rect={overlay.rect!} artwork={overlay.artwork!} onClose={closeOverlay} />}
        {overlay && overlay.kind === "more"         && <MoreMenu rect={overlay.rect!} artwork={overlay.artwork!} onClose={closeOverlay} />}
        {overlay && overlay.kind === "lightbox"     && <Lightbox artwork={overlay.artwork!} onClose={closeOverlay} />}
        {overlay && overlay.kind === "submit"       && <SubmitModal onClose={closeOverlay} />}
        {overlay && overlay.kind === "participants" && <ParticipantsModal onClose={closeOverlay} />}
        {overlay && overlay.kind === "confirm"      && <ConfirmDialog spec={overlay.spec!} onClose={closeOverlay} />}

        <AnnotationLayer on={annotate} />
        {chrome && <DevBar value={viewState} onChange={setViewState} annotate={annotate} onAnnotate={setAnnotate} />}
      </div>
    </AppCtx.Provider>
  );
}

if (typeof window !== "undefined") {
  (window as any).ArtvaultApp = App;
}
