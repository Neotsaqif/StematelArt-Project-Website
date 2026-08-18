import React, { useState, useRef, useEffect, useCallback } from 'react';

// Context
import { AppCtx } from './context/AppContext';

// Data & Helpers
import { COLLECTION_SEED, ARTWORKS, ORDERS, AUTH_SCREENS, EXPORT_FRAMES } from './data/mockData';
import { toast } from './utils/helpers';

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
import { LoginModal } from './components/modals/LoginModal';
import { NotifDropdown } from './components/modals/NotifDropdown';
import { AvatarMenu } from './components/modals/AvatarMenu';
import { CollectionsPopover } from './components/modals/CollectionsPopover';
import { SharePopover } from './components/modals/SharePopover';
import { MoreMenu } from './components/modals/MoreMenu';
import { Lightbox } from './components/modals/Lightbox';
import { SubmitModal } from './components/modals/SubmitModal';
import { ParticipantsModal } from './components/modals/ParticipantsModal';
import { ConfirmDialog } from './components/modals/ConfirmDialog';

// Pages
import { DiscoveryPage } from './pages/DiscoveryPage';
import { RankingPage } from './pages/RankingPage';
import { CommissionPage } from './pages/CommissionPage';
import { OrderPage } from './pages/OrderPage';
import { ContestPage } from './pages/ContestPage';
import { ArtworkDetailPage } from './pages/ArtworkDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { FavoritesPage } from './pages/FavoritesPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { CollectionDetailPage } from './pages/CollectionDetailPage';
import { SearchPage } from './pages/SearchPage';
import { CategoryPage } from './pages/CategoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { UploadPage } from './pages/UploadPage';
import { WatermarkPage } from './pages/WatermarkPage';
import { AboutPage } from './pages/AboutPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { CheckEmailPage } from './pages/auth/CheckEmailPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { OnboardingPage } from './pages/auth/OnboardingPage';

const DEEP_LINK = (() => {
  try {
    const q = new URLSearchParams(location.search + "&" + location.hash.replace(/^#/, ""));
    const screen = q.get("screen");
    return { screen: screen || "discovery", auth: q.get("auth") !== "out" && !AUTH_SCREENS.includes(screen || "") };
  } catch (e) { return { screen: "discovery", auth: true }; }
})();

function ExportAll() {
  return (
    <div style={{ background: "#FFFFFF" }}>
      <style>{".av-frame aside{height:100% !important}.av-frame .av-mobilenav,.av-frame .md\\:hidden{display:none !important}"}</style>
      {EXPORT_FRAMES.map(([label, screen, params, auth]) => (
        <div key={label} style={{ width: 1440, margin: "0 auto 96px" }}>
          <p style={{ font: "700 13px 'Plus Jakarta Sans', system-ui", color: "#A1A1AA", padding: "0 0 10px", letterSpacing: "0.04em" }}>{label}</p>
          <div className="av-frame" style={{ position: "relative", transform: "translate(0,0)", border: "1px solid #E5E5E7", overflow: "hidden", background: "#FFFFFF" }}>
            <App screen0={screen} params0={params} auth0={auth} exportMode />
          </div>
        </div>
      ))}
    </div>
  );
}

export function App(props = {}) {
  const [view, setView] = useState({ screen: props.screen0 || DEEP_LINK.screen, params: props.params0 || {} });
  const [stack, setStack] = useState([]);
  const [liked, setLiked] = useState(new Set());
  const [saved, setSaved] = useState(new Set());
  const [followed, setFollowed] = useState(new Set());
  const [collections, setCollections] = useState(COLLECTION_SEED);
  const [loggedIn, setLoggedIn] = useState(props.auth0 !== undefined ? props.auth0 : DEEP_LINK.auth);
  const [viewState, setViewState] = useState("normal");
  const [annotate, setAnnotate] = useState(false);
  const [overlay, setOverlay] = useState(null);
  const pending = useRef(null);
  const restore = useRef(null);
  const [, iconTick] = useState(0);

  useEffect(() => {
    if (window.lucide) return;
    const t = setInterval(() => { if (window.lucide) { clearInterval(t); iconTick(n => n + 1); } }, 60);
    setTimeout(() => clearInterval(t), 8000);
    return () => clearInterval(t);
  }, []);

  // Scroll restore
  useEffect(() => {
    if (restore.current !== null) {
      const y = restore.current;
      restore.current = null;
      requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: y })));
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [view]);

  const push = useCallback((screen, params = {}) => {
    setStack(s => [...s, { ...view, scroll: window.scrollY }]);
    setOverlay(null);
    setView({ screen, params });
  }, [view]);

  const back = useCallback(() => {
    setStack(s => {
      if (!s.length) { setView({ screen: "discovery", params: {} }); return s; }
      const prev = s[s.length - 1];
      restore.current = prev.scroll;
      setView({ screen: prev.screen, params: prev.params });
      return s.slice(0, -1);
    });
    setOverlay(null);
  }, []);

  const requireAuth = useCallback((fn) => {
    if (loggedIn) { fn(); return; }
    pending.current = fn;
    setOverlay({ kind: "login" });
  }, [loggedIn]);

  const app = {
    screen: view.screen,
    params: view.params,
    viewState, liked, saved, followed, collections, loggedIn,
    navigate: (s, p) => push(s, p),
    signIn: () => setLoggedIn(true),
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
    logout: () => { setLoggedIn(false); toast("Kamu telah keluar"); },
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
  const screen = view.screen;
  const chrome = !props.exportMode;

  if (!props.screen0 && DEEP_LINK.screen === "all") return <ExportAll />;

  if (AUTH_SCREENS.includes(screen)) {
    return (
      <AppCtx.Provider value={app}>
        <div className={chrome ? "min-h-screen bg-white" : "bg-white"} style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}>
          {chrome && <Toaster />}
          {screen === "login"      && <LoginPage />}
          {screen === "signup"     && <SignupPage />}
          {screen === "forgot"     && <ForgotPasswordPage />}
          {screen === "checkEmail" && <CheckEmailPage />}
          {screen === "reset"      && <ResetPasswordPage />}
          {screen === "onboarding" && <OnboardingPage />}
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
            {screen === "discovery"   && <DiscoveryPage />}
            {screen === "ranking"     && <RankingPage />}
            {screen === "commission"  && <CommissionPage />}
            {screen === "contest"     && <ContestPage />}
            {screen === "order"       && <OrderPage />}
            {screen === "upload"      && <UploadPage />}
            {screen === "watermark"   && <WatermarkPage />}
            {screen === "favorites"   && <FavoritesPage />}
            {screen === "collections" && <CollectionsPage />}
            {screen === "collection"  && <CollectionDetailPage />}
            {screen === "search"      && <SearchPage />}
            {screen === "category"    && <CategoryPage />}
            {screen === "settings"    && <SettingsPage />}
            {screen === "profile"     && <ProfilePage />}
            {screen === "about"       && <AboutPage navigate={app.navigate} />}
            {screen === "artwork"     && view.params.artwork && <ArtworkDetailPage artwork={view.params.artwork} />}
          </div>
          <Footer navigate={app.navigate} />
        </main>

        <MobileNav />

        {overlay && overlay.kind === "login"        && <LoginModal onClose={closeOverlay} onDone={() => { setLoggedIn(true); closeOverlay(); const fn = pending.current; pending.current = null; toast.success("Berhasil masuk", { description: fn ? "Tindakanmu dilanjutkan" : undefined }); if (fn) setTimeout(fn, 60); }} />}
        {overlay && overlay.kind === "notifs"       && <NotifDropdown rect={overlay.rect} onClose={closeOverlay} />}
        {overlay && overlay.kind === "avatar"       && <AvatarMenu rect={overlay.rect} onClose={closeOverlay} />}
        {overlay && overlay.kind === "collections"  && <CollectionsPopover rect={overlay.rect} artwork={overlay.artwork} onClose={closeOverlay} />}
        {overlay && overlay.kind === "share"        && <SharePopover rect={overlay.rect} artwork={overlay.artwork} onClose={closeOverlay} />}
        {overlay && overlay.kind === "more"         && <MoreMenu rect={overlay.rect} artwork={overlay.artwork} onClose={closeOverlay} />}
        {overlay && overlay.kind === "lightbox"     && <Lightbox artwork={overlay.artwork} onClose={closeOverlay} />}
        {overlay && overlay.kind === "submit"       && <SubmitModal onClose={closeOverlay} />}
        {overlay && overlay.kind === "participants" && <ParticipantsModal onClose={closeOverlay} />}
        {overlay && overlay.kind === "confirm"      && <ConfirmDialog spec={overlay.spec} onClose={closeOverlay} />}

        <AnnotationLayer on={annotate} />
        {chrome && <DevBar value={viewState} onChange={setViewState} annotate={annotate} onAnnotate={setAnnotate} />}
      </div>
    </AppCtx.Provider>
  );
}

if (typeof window !== "undefined") {
  window.ArtvaultApp = App;
}
