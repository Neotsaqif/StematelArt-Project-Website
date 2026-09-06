export interface Artwork {
  id: number;
  photoId: string;
  aspect: number;
  title: string;
  artist: string;
  artistId: string;
  avatarBg: string;
  initials: string;
  likes: number;
  comments: number;
  views: number;
  category: string;
  tags: string[];
  description: string;
}

export interface Category {
  name: string;
  photoId: string;
  count: string;
}

export interface CommissionDeliverable {
  label: string;
  ok: boolean;
}

export interface CommissionTier {
  name: string;
  price: string;
  days: string;
  revisions: number;
  popular?: boolean;
  deliverables: CommissionDeliverable[];
}

export interface CommissionArtist {
  id: string;
  name: string;
  avatarBg: string;
  initials: string;
  status: 'open' | 'waitlist' | 'closed';
  statusLabel: string;
  specialty: string;
  slots: number;
  rating: number;
  reviews: number;
  portfolio: Artwork[];
  tiers: CommissionTier[];
}

export interface Order {
  id: string;
  artist: string;
  bg: string;
  init: string;
  tier: string;
  price: string;
  status: 'accepted' | 'declined' | 'pending';
  label: string;
  note: string;
}

export interface Notification {
  id: number;
  kind: 'artwork' | 'comment' | 'order';
  who: string;
  bg: string;
  init: string;
  text: string;
  ago: string;
  art?: number;
  order?: string;
}

export interface Collection {
  id: string;
  name: string;
  ids: number[];
}

export interface Participant {
  id: string;
  name: string;
  bg: string;
  init: string;
  works: number;
}

export interface Comment {
  user: string;
  bg: string;
  init: string;
  text: string;
  ago: string;
  likes: number;
}

export interface Profile {
  name: string;
  avatarBg: string;
  initials: string;
  followers: number;
  following: number;
  works: number;
  bio: string;
  location: string;
  website: string;
  bannerPhotoId: string;
  tools: string[];
}

export interface ConfirmSpec {
  title: string;
  body: string;
  label: string;
  onOk: () => void;
}

export interface AppOverlay {
  kind: 'login' | 'notifs' | 'avatar' | 'collections' | 'share' | 'more' | 'lightbox' | 'submit' | 'participants' | 'confirm';
  rect?: DOMRect | null;
  artwork?: Artwork;
  spec?: ConfirmSpec;
}

import { AuthUser } from '../services/api';

export interface AppContextType {
  screen: string;
  params: any;
  viewState: string;
  liked: Set<number>;
  saved: Set<number>;
  followed: Set<string>;
  collections: Collection[];
  loggedIn: boolean;
  currentUser: AuthUser | null;
  navigate: (screen: string, params?: any) => void;
  signIn: (user?: AuthUser) => void;
  back: () => void;
  requireAuth: (fn: () => void) => void;
  retry: () => void;
  openArtwork: (artwork: Artwork) => void;
  openProfile: (artistId?: string) => void;
  openCommission: (params?: any) => void;
  openOrder: (order: Order) => void;
  openSearch: (query: string) => void;
  openCategory: (category: string) => void;
  openCollection: (collection: Collection) => void;
  toggleLike: (artwork: Artwork) => void;
  toggleFollow: (artistId: string) => void;
  saveTo: (collection: Collection, artwork: Artwork) => void;
  createCollection: (name: string, artwork: Artwork) => void;
  logout: () => Promise<void>;
  confirm: (spec: ConfirmSpec) => void;
  openNotifs: (rect: DOMRect | null) => void;
  openAvatarMenu: (rect: DOMRect | null) => void;
  openCollections: (artwork: Artwork, rect: DOMRect | null) => void;
  openShare: (artwork: Artwork, rect: DOMRect | null) => void;
  openMore: (artwork: Artwork, rect: DOMRect | null) => void;
  openLightbox: (artwork: Artwork) => void;
  openSubmit: () => void;
  openParticipants: () => void;
}
