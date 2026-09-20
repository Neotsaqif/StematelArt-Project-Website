export interface Post {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  tags: string | null;
  artwork_path: string | null;
  artwork_url: string | null;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    bio: string | null;
    avatar: string | null;
  };
}

export interface ApiComment {
  id: number;
  user_id: number;
  post_id: number;
  body: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
  };
}

export interface Like {
  id: number;
  user_id: number;
  post_id: number;
  created_at: string;
}

export interface Save {
  id: number;
  user_id: number;
  post_id: number;
  created_at: string;
}

export interface CreatePostPayload {
  title: string;
  description?: string;
  tags?: string;
  artwork: File;
}

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

export type CommissionOrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'in_progress'
  | 'delivered'
  | 'completed'
  | 'released'
  | 'expired'
  | 'cancelled';

export interface CommissionUser {
  id: number;
  name: string;
  email: string;
  role: string;
  bio: string | null;
  avatar: string | null;
}

export interface CommissionPackage {
  id: number;
  artist_id: number;
  title: string;
  description: string | null;
  price: number;
  platform_fee_rate: number;
  delivery_time: number;
  terms: string | null;
  active: boolean;
  artist: CommissionUser;
}

export interface OrderStatusHistory {
  id: number;
  order_id: number;
  from_status: CommissionOrderStatus | null;
  to_status: CommissionOrderStatus;
  actor_id: number;
  created_at: string;
}

export interface EscrowTransaction {
  id: number;
  order_id: number;
  type: 'hold' | 'release' | 'refund';
  status: 'held' | 'released' | 'failed';
  gateway_reference: string | null;
  amount: number;
  created_at: string;
  last_attempted_at: string | null;
}

export interface CommissionOrder {
  id: number;
  package_id: number;
  buyer_id: number;
  artist_id: number;
  amount: number;
  platform_fee_amount: number;
  artist_payout_amount: number;
  brief: string;
  reference_image: string | null;
  deadline_at: string | null;
  status: CommissionOrderStatus;
  payment_created_at: string | null;
  payment_expires_at: string | null;
  cancelled_at: string | null;
  expired_at: string | null;
  created_at: string;
  updated_at: string;
  buyer: CommissionUser;
  artist: CommissionUser;
  package: CommissionPackage;
  status_history?: OrderStatusHistory[];
  escrow_transactions?: EscrowTransaction[];
}

export interface CreateCommissionOrderPayload {
  package_id: number;
  brief: string;
  reference_image?: string;
  deadline_at?: string;
}

export interface PaymentResponse {
  order_id: string;
  snap_token: string;
  redirect_url: string | null;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

// Deprecated mock Order, remove when migration complete.
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

export interface LegacyComment {
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
  kind: 'login' | 'notifs' | 'avatar' | 'collections' | 'share' | 'more' | 'lightbox' | 'submit' | 'participants' | 'confirm' | 'midtrans';
  rect?: DOMRect | null;
  artwork?: Artwork;
  spec?: ConfirmSpec;
  data?: MidtransPaymentData;
}

export interface MidtransPaymentData {
  snapToken: string;
  orderId: string;
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
  openOrder: (order: CommissionOrder | Order) => void;
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
  openMidtransPayment: (data: MidtransPaymentData) => void;
}
