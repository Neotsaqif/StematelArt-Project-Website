import React from 'react';

const R = window.React || React;

const ICON_ALIASES = {
  CheckCircle: "CircleCheck",
  Share2: "Share2Icon",
  Link2: "Link2Icon",
  PenTool: "PenToolIcon",
  AlertTriangle: "TriangleAlert",
  ImageIcon: "Image"
};

const SVG_ATTR = {
  "stroke-width": "strokeWidth",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "fill-rule": "fillRule",
  "clip-rule": "clipRule",
  "fill-opacity": "fillOpacity",
  "stroke-opacity": "strokeOpacity",
  "stroke-dasharray": "strokeDasharray"
};

function fixAttrs(a) {
  const o = {};
  for (const k in (a || {})) o[SVG_ATTR[k] || k] = a[k];
  return o;
}

function iconNode(name) {
  const L = window.lucide;
  if (!L) return null;
  const src = L.icons || L;
  return src[name] || src[ICON_ALIASES[name]] || null;
}

function nodeKids(node) {
  if (!Array.isArray(node)) return [];
  if (typeof node[0] === "string") return Array.isArray(node[2]) ? node[2] : [];
  return node;
}

function renderKids(kids) {
  return (kids || []).map((c, i) => {
    if (!Array.isArray(c)) return null;
    const kids2 = Array.isArray(c[2]) ? renderKids(c[2]) : null;
    return R.createElement(c[0], { key: i, ...fixAttrs(c[1]) }, kids2);
  });
}

function makeIcon(name) {
  return function LucideIcon({ size = 24, fill = "none", strokeWidth = 2, className = "", style, ...rest }) {
    return R.createElement(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill,
        stroke: "currentColor",
        strokeWidth,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: ("lucide " + className).trim(),
        style,
        ...rest,
      },
      renderKids(nodeKids(iconNode(name)))
    );
  };
}

export const Search = makeIcon("Search");
export const Upload = makeIcon("Upload");
export const Compass = makeIcon("Compass");
export const Trophy = makeIcon("Trophy");
export const Briefcase = makeIcon("Briefcase");
export const Award = makeIcon("Award");
export const Heart = makeIcon("Heart");
export const Bookmark = makeIcon("Bookmark");
export const Bell = makeIcon("Bell");
export const Eye = makeIcon("Eye");
export const MessageCircle = makeIcon("MessageCircle");
export const Share2 = makeIcon("Share2");
export const Plus = makeIcon("Plus");
export const Crown = makeIcon("Crown");
export const ChevronRight = makeIcon("ChevronRight");
export const Palette = makeIcon("Palette");
export const Camera = makeIcon("Camera");
export const PenTool = makeIcon("PenTool");
export const Cpu = makeIcon("Cpu");
export const User = makeIcon("User");
export const Layers = makeIcon("Layers");
export const BookOpen = makeIcon("BookOpen");
export const MapPin = makeIcon("MapPin");
export const Link2 = makeIcon("Link2");
export const Star = makeIcon("Star");
export const Send = makeIcon("Send");
export const ArrowLeft = makeIcon("ArrowLeft");
export const Check = makeIcon("Check");
export const CheckCircle = makeIcon("CheckCircle");
export const TrendingUp = makeIcon("TrendingUp");

export const X = makeIcon("X");
export const Lock = makeIcon("Lock");
export const AlertTriangle = makeIcon("AlertTriangle");
export const Stamp = makeIcon("Stamp");
export const Type = makeIcon("Type");
export const ImageIcon = makeIcon("ImageIcon");
export const RefreshCw = makeIcon("RefreshCw");
export const Clock = makeIcon("Clock");
export const Repeat = makeIcon("Repeat");
export const Settings = makeIcon("Settings");
export const XCircle = makeIcon("XCircle");
export const Download = makeIcon("Download");
export const MoreHorizontal = makeIcon("MoreHorizontal");
export const Flag = makeIcon("Flag");
export const Link = makeIcon("Link");
export const Maximize2 = makeIcon("Maximize2");
export const Folder = makeIcon("Folder");
export const FolderPlus = makeIcon("FolderPlus");
export const LogOut = makeIcon("LogOut");
export const Copy = makeIcon("Copy");
export const ChevronLeft = makeIcon("ChevronLeft");
export const Info = makeIcon("Info");
export const Reply = makeIcon("Reply");
export const Tag = makeIcon("Tag");

export const EyeOff = makeIcon("EyeOff");
export const Mail = makeIcon("Mail");
export const Shield = makeIcon("Shield");
export const ArrowRight = makeIcon("ArrowRight");
export const Sparkles = makeIcon("Sparkles");
export const Users = makeIcon("Users");
