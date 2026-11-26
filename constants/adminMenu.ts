import {
  Ionicons,
} from "@expo/vector-icons";

export type AdminMenuItem = {
  label: string;
  path: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export const adminMenu: AdminMenuItem[] = [
  {
    label: "Dashboard",
    path: "/(admin)",
    icon: "grid-outline",
  },

  {
    label: "Transaction Panel",
    path: "/(transactions)",
    icon: "swap-horizontal-outline",
  },

  {
    label: "Blog Posts",
    path: "/(admin)/blogs",
    icon: "document-text-outline",
  },

  {
    label: "Neighborhoods",
    path: "/(admin)/community",
    icon: "business-outline",
  },

  {
    label: "Resources",
    path: "/(admin)/resources",
    icon: "book-outline",
  },

  {
    label: "Listings",
    path: "/(admin)/listings",
    icon: "home-outline",
  },

  {
    label: "Leads",
    path: "/(admin)/leads",
    icon: "people-outline",
  },

  {
    label: "Home Valuations",
    path: "/(admin)/home-valuations",
    icon: "calculator-outline",
  },

  {
    label: "FAQs",
    path: "/(admin)/faqs",
    icon: "help-circle-outline",
  },

  {
    label: "Testimonials",
    path: "/(admin)/testimonials",
    icon: "star-outline",
  },

  {
    label: "Social Post",
    path: "/(admin)/socialpost",
    icon: "image-outline",
  },
  
  {
    label: "Scheduled Posts",
    path: "/(admin)/scheduledpost",
    icon: "calendar-outline",
  },

  {
    label: "Image Design",
    path: "/(admin)/createimage",
    icon: "color-wand-outline",
  },

  {
    label: "Newsletter",
    path: "/(admin)/subscriptions",
    icon: "mail-outline",
  },

  {
    label: "Settings",
    path: "/(admin)/settings",
    icon: "settings-outline",
  },
];