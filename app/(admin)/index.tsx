import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  useRouter,
} from "expo-router";

import {
  LineChart,
} from "react-native-chart-kit";

import axios from "axios";

import {
  useAuth,
} from "../../contexts/AuthContext";


/* =========================================================
   CONFIG
========================================================= */

const API_URL = "https://realtorparth.ca";
const OFFICE_KEY = "282923";

const SCREEN_WIDTH =
  Dimensions.get("window").width;


/* =========================================================
   TYPES
========================================================= */

type Status =
  | "Connected"
  | "Live"
  | "Down";

interface Stat {
  label: string;
  value: string | number;
  subtext: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
}

interface ActivityItem {
  type:
  | "Blog"
  | "Listing"
  | "FAQ"
  | "Lead";

  text: string;
  date: string;
}

interface VisitorStat {
  date: string;
  visitors: number;
}

interface CountryStat {
  country: string;
  countryCode: string;
  visitors: number;
}

interface DeviceStat {
  device:
  | "Desktop"
  | "Mobile"
  | "Tablet"
  | "Unknown";

  visitors: number;
}


/* =========================================================
   HELPERS
========================================================= */

function getCountryFlag(
  countryCode: string
): string {

  if (
    !countryCode ||
    countryCode === "UN"
  ) {
    return "🌐";
  }

  return countryCode
    .toUpperCase()
    .split("")
    .map((char) =>
      String.fromCodePoint(
        127397 +
        char.charCodeAt(0)
      )
    )
    .join("");
}


function formatDate(
  date?: string
): string {

  if (!date) {
    return "N/A";
  }

  try {

    return new Date(
      date
    ).toLocaleDateString();

  } catch {

    return "N/A";
  }
}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  subtext,
  icon,
  iconBg,
}: Stat) {

  return (
    <View className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">

      <View className="flex-row items-start justify-between">

        <View className="mr-2 flex-1">

          <Text className="mb-2 text-xs font-medium text-gray-500">
            {label}
          </Text>

          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            className="text-3xl font-bold tracking-tight text-gray-900"
          >
            {value}
          </Text>

        </View>

        <View
          className={`h-11 w-11 items-center justify-center rounded-2xl ${iconBg}`}
        >

          <Ionicons
            name={icon}
            size={21}
            color="#FFFFFF"
          />

        </View>

      </View>

      <View className="mt-4 border-t border-gray-100 pt-3">

        <Text
          numberOfLines={2}
          className="text-[11px] leading-4 text-gray-500"
        >
          {subtext}
        </Text>

      </View>

    </View>
  );
}


/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {

  return (
    <Pressable
      onPress={onPress}
      className="min-h-[84px] rounded-2xl border border-gray-200 bg-white p-4 active:bg-gray-50"
    >

      <View className="flex-row items-center justify-between">

        <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#A8794A]/10">

          <Ionicons
            name={icon}
            size={20}
            color="#A8794A"
          />

        </View>

        <Ionicons
          name="arrow-forward"
          size={17}
          color="#9CA3AF"
        />

      </View>

      <Text className="mt-3 text-sm font-semibold text-gray-900">
        {title}
      </Text>

    </Pressable>
  );
}


/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  title,
  description,
  action,
  onAction,
}: {
  title: string;
  description?: string;
  action?: string;
  onAction?: () => void;
}) {

  return (
    <View className="flex-row items-center justify-between">

      <View className="mr-3 flex-1">

        <Text className="text-xl font-bold text-gray-900">
          {title}
        </Text>

        {description ? (
          <Text className="mt-1 text-sm leading-5 text-gray-500">
            {description}
          </Text>
        ) : null}

      </View>

      {action && onAction ? (
        <Pressable
          onPress={onAction}
          className="flex-row items-center"
        >

          <Text className="font-semibold text-[#A8794A]">
            {action}
          </Text>

          <Ionicons
            name="arrow-forward"
            size={15}
            color="#A8794A"
            style={{
              marginLeft: 5,
            }}
          />

        </Pressable>
      ) : null}

    </View>
  );
}


/* =========================================================
   STATUS ITEM
========================================================= */

function StatusItem({
  label,
  status,
}: {
  label: string;
  status: Status;
}) {

  const isUp =
    status !== "Down";

  return (
    <View className="mb-3 flex-row items-center justify-between rounded-2xl bg-gray-50 p-4">

      <View className="flex-1 flex-row items-center">

        <View
          className={`mr-3 h-2.5 w-2.5 rounded-full ${isUp
              ? "bg-green-500"
              : "bg-red-500"
            }`}
        />

        <Text className="font-medium text-gray-900">
          {label}
        </Text>

      </View>

      <View
        className={`rounded-full px-3 py-1.5 ${isUp
            ? "bg-green-100"
            : "bg-red-100"
          }`}
      >

        <Text
          className={`text-[10px] font-bold uppercase ${isUp
              ? "text-green-700"
              : "text-red-700"
            }`}
        >
          {status}
        </Text>

      </View>

    </View>
  );
}


/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {

  return (
    <View className="items-center py-8">

      <Ionicons
        name={icon}
        size={34}
        color="#D1D5DB"
      />

      <Text className="mt-2 text-sm text-gray-400">
        {text}
      </Text>

    </View>
  );
}


/* =========================================================
   VISITOR SUMMARY CARD
========================================================= */

function VisitorSummaryCard({
  title,
  value,
  description,
  bg,
  border,
  titleColor,
  valueColor,
  descriptionColor,
}: {
  title: string;
  value: number;
  description: string;
  bg: string;
  border: string;
  titleColor: string;
  valueColor: string;
  descriptionColor: string;
}) {

  return (
    <View
      className={`rounded-3xl border p-5 ${bg} ${border}`}
    >

      <Text
        className={`text-xs font-bold uppercase tracking-wider ${titleColor}`}
      >
        {title}
      </Text>

      <Text
        className={`mt-3 text-4xl font-bold ${valueColor}`}
      >
        {value.toLocaleString()}
      </Text>

      <Text
        className={`mt-2 text-sm ${descriptionColor}`}
      >
        {description}
      </Text>

    </View>
  );
}


/* =========================================================
   DASHBOARD
========================================================= */

export default function DashboardScreen() {

  const router =
    useRouter();

  const {
    user,
    loading: authLoading,
  } = useAuth();


  /* =====================================================
     LOADING
  ===================================================== */

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  /* =====================================================
     BASIC STATS
  ===================================================== */

  const [
    totalListings,
    setTotalListings,
  ] = useState(0);

  const [
    totalBlogs,
    setTotalBlogs,
  ] = useState(0);

  const [
    totalFaqs,
    setTotalFaqs,
  ] = useState(0);

  const [
    totalSubscribers,
    setTotalSubscribers,
  ] = useState(0);

  const [
    totalLeads,
    setTotalLeads,
  ] = useState(0);


  /* =====================================================
     SECONDARY STATS
  ===================================================== */

  const [
    selectedListings,
    setSelectedListings,
  ] = useState(0);

  const [
    publishedBlogs,
    setPublishedBlogs,
  ] = useState(0);

  const [
    draftBlogs,
    setDraftBlogs,
  ] = useState(0);

  const [
    activeSubscribers,
    setActiveSubscribers,
  ] = useState(0);

  const [
    unsubscribedSubscribers,
    setUnsubscribedSubscribers,
  ] = useState(0);


  /* =====================================================
     STATUS
  ===================================================== */

  const [
    dbStatus,
    setDbStatus,
  ] = useState<Status>(
    "Connected"
  );

  const [
    marketApiStatus,
    setMarketApiStatus,
  ] = useState<Status>(
    "Live"
  );

  const [
    blogApiStatus,
    setBlogApiStatus,
  ] = useState<Status>(
    "Live"
  );

  const [
    subscriberStatus,
    setSubscriberStatus,
  ] = useState<Status>(
    "Live"
  );

  const [
    leadStatus,
    setLeadStatus,
  ] = useState<Status>(
    "Live"
  );


  /* =====================================================
     ACTIVITY / LEADS
  ===================================================== */

  const [
    recentActivity,
    setRecentActivity,
  ] = useState<ActivityItem[]>(
    []
  );

  const [
    recentLeads,
    setRecentLeads,
  ] = useState<any[]>(
    []
  );


  /* =====================================================
     VISITORS
  ===================================================== */

  const [
    visitorStats,
    setVisitorStats,
  ] = useState<VisitorStat[]>(
    []
  );

  const [
    visitorSummary,
    setVisitorSummary,
  ] = useState<any>(
    null
  );

  const [
    topCountries,
    setTopCountries,
  ] = useState<CountryStat[]>(
    []
  );

  const [
    deviceStats,
    setDeviceStats,
  ] = useState<DeviceStat[]>(
    []
  );


  /* =====================================================
     UI
  ===================================================== */

  const [
    showVisitorsModal,
    setShowVisitorsModal,
  ] = useState(false);

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState("");


  /* =====================================================
     AUTH REDIRECT
  ===================================================== */

  useEffect(() => {

    if (authLoading) {
      return;
    }

    if (!user) {

      router.replace(
        "/login"
      );

    }

  }, [
    user,
    authLoading,
    router,
  ]);


  /* =====================================================
     FETCH DASHBOARD DATA
  ===================================================== */

  const fetchDashboardData =
    useCallback(
      async (
        isRefresh = false
      ) => {

        try {

          if (isRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }


          /* =====================================
             API REQUESTS
          ===================================== */

          const [
            listingRes,
            blogRes,
            faqRes,
            leadRes,
            subscriberRes,
            analyticsRes,
            analyticsSummaryRes,
          ] = await Promise.all([
            axios.get(
              `${API_URL}/api/properties/office/admin/${OFFICE_KEY}`,
              {
                timeout: 30000,
              }
            ),

            axios.get(
              `${API_URL}/api/blogging/dashboard-stats`,
              {
                timeout: 10000,
              }
            ),

            axios.get(
              `${API_URL}/api/faqs/dashboard-stats`,
              {
                timeout: 10000,
              }
            ),

            axios.get(
              `${API_URL}/api/contact/dashboard-stats`,
              {
                timeout: 10000,
              }
            ),

            axios.get(
              `${API_URL}/api/subscribe/dashboard-stats`,
              {
                timeout: 10000,
              }
            ),

            axios.get(
              `${API_URL}/api/analytics/dashboard-monthly-visitors`,
              {
                timeout: 10000,
              }
            ),

            axios.get(
              `${API_URL}/api/analytics/dashboard-summary`,
              {
                timeout: 10000,
              }
            ),
          ]);


          /* =====================================
             LISTINGS
          ===================================== */

          const listingsArray =
            listingRes.data
              ?.properties
              ?.results ||
            listingRes.data
              ?.properties ||
            [];

          setTotalListings(
            listingsArray.length
          );

          setSelectedListings(
            listingsArray.filter(
              (listing: any) =>
                listing.isSelected ===
                true
            ).length
          );

          setMarketApiStatus(
            "Live"
          );


          /* =====================================
             BLOGS
          ===================================== */

          let recentBlogs: any[] =
            [];

          if (
            blogRes.data
          ) {

            const data =
              blogRes.data;

            setTotalBlogs(
              data.totalBlogs ??
              data.total ??
              0
            );

            setPublishedBlogs(
              data.publishedBlogs ??
              data.published ??
              0
            );

            setDraftBlogs(
              data.draftBlogs ??
              data.drafts ??
              0
            );

            recentBlogs =
              data.recentBlogs ||
              [];

            setBlogApiStatus(
              "Live"
            );

          }


          /* =====================================
             FAQS
          ===================================== */

          let recentFaqs: any[] =
            [];

          if (
            faqRes.data
          ) {

            const data =
              faqRes.data;

            setTotalFaqs(
              data.totalFaqs ??
              data.total ??
              0
            );

            recentFaqs =
              data.recentFaqs ||
              [];

          }


          /* =====================================
             LEADS
          ===================================== */

          let activityLeads: any[] =
            [];

          if (
            leadRes.data
          ) {

            const data =
              leadRes.data;

            setTotalLeads(
              data.totalLeads ??
              data.total ??
              0
            );

            const latest =
              data.recentLeads ||
              [];

            setRecentLeads(
              latest
            );

            activityLeads =
              data.activityLeads ||
              latest;

            setLeadStatus(
              "Live"
            );

          }


          /* =====================================
             SUBSCRIBERS
          ===================================== */

          if (
            subscriberRes.data
          ) {

            const data =
              subscriberRes.data;

            setTotalSubscribers(
              data.totalSubscribers ??
              data.total ??
              0
            );

            setActiveSubscribers(
              data.activeSubscribers ??
              data.active ??
              0
            );

            setUnsubscribedSubscribers(
              data.unsubscribedSubscribers ??
              data.unsubscribed ??
              0
            );

            setSubscriberStatus(
              "Live"
            );

          }


          /* =====================================
             VISITOR CHART
          ===================================== */

          const monthlyVisitors =
            analyticsRes.data
              ?.data ||
            [];

          setVisitorStats(
            monthlyVisitors.map(
              (item: any) => ({
                date:
                  item._id,
                visitors:
                  item.visitors,
              })
            )
          );


          /* =====================================
             VISITOR SUMMARY
          ===================================== */

          const summary =
            analyticsSummaryRes
              .data
              ?.data ||
            {};

          setVisitorSummary(
            summary
          );

          setTopCountries(
            summary.topCountries ||
            []
          );

          setDeviceStats(
            summary.devices ||
            []
          );


          /* =====================================
             RECENT ACTIVITY
          ===================================== */

          const activities: ActivityItem[] =
            [];


          recentBlogs
            .slice(0, 3)
            .forEach(
              (
                blog: any
              ) => {

                activities.push({
                  type: "Blog",

                  text:
                    `New blog published: ${blog.title ||
                    "Untitled blog"
                    }`,

                  date:
                    blog.createdAt ||
                    new Date().toISOString(),
                });

              }
            );


          listingsArray
            .slice(0, 3)
            .forEach(
              (
                listing: any
              ) => {

                activities.push({
                  type: "Listing",

                  text:
                    `New listing added: ${listing.UnparsedAddress ||
                    listing.Address ||
                    "Property"
                    }`,

                  date:
                    listing.ListingContractDate ||
                    listing.createdAt ||
                    new Date().toISOString(),
                });

              }
            );


          recentFaqs
            .slice(0, 2)
            .forEach(
              (
                faq: any
              ) => {

                activities.push({
                  type: "FAQ",

                  text:
                    `FAQ updated: ${faq.question ||
                    "FAQ"
                    }`,

                  date:
                    faq.updatedAt ||
                    faq.createdAt ||
                    new Date().toISOString(),
                });

              }
            );


          activityLeads
            .slice(0, 3)
            .forEach(
              (
                lead: any
              ) => {

                activities.push({
                  type: "Lead",

                  text:
                    `New lead from ${lead.email ||
                    lead.name ||
                    "Customer"
                    }`,

                  date:
                    lead.createdAt ||
                    new Date().toISOString(),
                });

              }
            );


          activities.sort(
            (
              a,
              b
            ) =>
              new Date(
                b.date
              ).getTime() -
              new Date(
                a.date
              ).getTime()
          );


          setRecentActivity(
            activities.slice(
              0,
              8
            )
          );


          /* =====================================
             SYSTEM
          ===================================== */

          setDbStatus(
            "Connected"
          );

          setMarketApiStatus(
            "Live"
          );

          setBlogApiStatus(
            "Live"
          );

          setSubscriberStatus(
            "Live"
          );

          setLeadStatus(
            "Live"
          );


          /* =====================================
             LAST UPDATED
          ===================================== */

          setLastUpdated(
            new Date().toLocaleTimeString()
          );

        } catch (
        error
        ) {

          console.error(
            "Dashboard Error:",
            error
          );

          if (
            axios.isAxiosError(
              error
            )
          ) {

            console.error(
              "URL:",
              error.config
                ?.url
            );

            console.error(
              "Status:",
              error.response
                ?.status
            );

            console.error(
              "Response:",
              error.response
                ?.data
            );

          }

        } finally {

          setLoading(false);
          setRefreshing(false);

        }

      },
      []
    );


  /* =====================================================
     INITIAL LOAD + AUTO REFRESH
  ===================================================== */

  useEffect(() => {

    if (
      authLoading ||
      !user
    ) {
      return;
    }

    fetchDashboardData();

    const interval =
      setInterval(
        () => {
          fetchDashboardData();
        },
        30000
      );

    return () =>
      clearInterval(
        interval
      );

  }, [
    authLoading,
    user,
    fetchDashboardData,
  ]);


  /* =====================================================
     STATS
  ===================================================== */

  const stats =
    useMemo<Stat[]>(
      () => [
        {
          label: "Listings",

          value:
            loading
              ? "—"
              : totalListings,

          subtext:
            `${selectedListings} Selected Properties`,

          icon:
            "home-outline",

          iconBg:
            "bg-blue-500",
        },

        {
          label: "Blogs",

          value:
            loading
              ? "—"
              : totalBlogs,

          subtext:
            `${publishedBlogs} Published • ${draftBlogs} Draft`,

          icon:
            "document-text-outline",

          iconBg:
            "bg-purple-500",
        },

        {
          label: "Leads",

          value:
            loading
              ? "—"
              : totalLeads,

          subtext:
            "Customer inquiries",

          icon:
            "people-outline",

          iconBg:
            "bg-green-500",
        },

        {
          label: "Subscribers",

          value:
            loading
              ? "—"
              : totalSubscribers,

          subtext:
            `${activeSubscribers} Active • ${unsubscribedSubscribers} Unsubscribed`,

          icon:
            "mail-outline",

          iconBg:
            "bg-orange-500",
        },

        {
          label: "FAQs",

          value:
            loading
              ? "—"
              : totalFaqs,

          subtext:
            "Knowledge base",

          icon:
            "help-circle-outline",

          iconBg:
            "bg-pink-500",
        },

        {
          label: "Market Status",

          value:
            marketApiStatus,

          subtext:
            "MLS API Connected",

          icon:
            "trending-up-outline",

          iconBg:
            marketApiStatus ===
              "Live"
              ? "bg-emerald-500"
              : "bg-red-500",
        },
      ],
      [
        loading,
        totalListings,
        selectedListings,
        totalBlogs,
        publishedBlogs,
        draftBlogs,
        totalLeads,
        totalSubscribers,
        activeSubscribers,
        unsubscribedSubscribers,
        totalFaqs,
        marketApiStatus,
      ]
    );


  /* =====================================================
     CHART
  ===================================================== */

  const chartLabels =
    visitorStats.length > 0
      ? visitorStats.map((item, index) => {

        // Show a label only every 5 days
        if (index % 5 !== 0) {
          return "";
        }

        const date = new Date(item.date);

        return `${date.getDate()}/${date.getMonth() + 1}`;
      })
      : [""];

  const chartValues =
    visitorStats.length > 0
      ? visitorStats.map(
        item => item.visitors
      )
      : [0];


  /* =====================================================
     AUTH LOADING
  ===================================================== */

  if (
    authLoading
  ) {

    return (
      <View className="flex-1 items-center justify-center bg-gray-100">

        <ActivityIndicator
          size="large"
          color="#A8794A"
        />

        <Text className="mt-4 text-gray-500">
          Checking authentication...
        </Text>

      </View>
    );
  }


  /* =====================================================
     NOT AUTHENTICATED
  ===================================================== */

  if (
    !user
  ) {

    return (
      <View className="flex-1 items-center justify-center bg-gray-100">

        <ActivityIndicator
          size="large"
          color="#A8794A"
        />

        <Text className="mt-4 text-gray-500">
          Redirecting to login...
        </Text>

      </View>
    );
  }


  /* =====================================================
     MAIN UI
  ===================================================== */

  return (
    <View className="flex-1 bg-gray-100">

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 pb-10 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={() =>
              fetchDashboardData(
                true
              )
            }
            tintColor="#A8794A"
          />
        }
      >

        {/* =================================================
                    HERO
                ================================================= */}

        <View className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

          <View className="p-5">

            <View className="flex-row items-start">

              <View className="mr-4 h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[#A8794A]/10">

                <Ionicons
                  name="analytics-outline"
                  size={28}
                  color="#A8794A"
                />

              </View>

              <View className="flex-1">

                <Text className="text-2xl font-bold leading-8 text-gray-900">
                  Dashboard Overview
                </Text>

                <Text className="mt-1 text-sm leading-5 text-gray-500">
                  Real-time analytics, activity monitoring,
                  visitor tracking, and admin overview.
                </Text>

              </View>

            </View>


            {/* STATUS */}

            <View className="mt-5 flex-row flex-wrap">

              <View className="mb-2 mr-2 flex-row items-center rounded-xl bg-gray-100 px-3 py-2">

                <Ionicons
                  name="refresh-outline"
                  size={14}
                  color="#6B7280"
                />

                <Text className="ml-1.5 text-xs text-gray-600">
                  Auto Refresh: Every 30s
                </Text>

              </View>


              <View className="mb-2 flex-row items-center rounded-xl bg-green-50 px-3 py-2">

                <View className="mr-1.5 h-2 w-2 rounded-full bg-green-500" />

                <Text className="text-xs font-semibold text-green-700">
                  System Online
                </Text>

              </View>

            </View>


            {/* REFRESH BUTTON */}

            <Pressable
              onPress={() =>
                fetchDashboardData(
                  true
                )
              }
              disabled={
                refreshing
              }
              className="mt-2 flex-row items-center justify-center rounded-2xl border border-gray-200 bg-white py-3.5 active:bg-gray-50"
            >

              {refreshing ? (

                <ActivityIndicator
                  size="small"
                  color="#A8794A"
                />

              ) : (

                <Ionicons
                  name="refresh-outline"
                  size={17}
                  color="#374151"
                />

              )}

              <Text className="ml-2 text-sm font-semibold text-gray-800">
                {refreshing
                  ? "Refreshing..."
                  : "Refresh Data"}
              </Text>

            </Pressable>


            {lastUpdated ? (

              <Text className="mt-3 text-center text-[11px] text-gray-400">
                Last updated:{" "}
                {lastUpdated}
              </Text>

            ) : null}

          </View>

        </View>


        {/* =================================================
                    QUICK ACTIONS
                ================================================= */}

        <Text className="mb-3 mt-6 text-lg font-bold text-gray-900">
          Quick Actions
        </Text>


        <View className="flex-row flex-wrap justify-between">

          <View className="mb-3 w-[48.5%]">

            <QuickAction
              title="Manage Blogs"
              icon="document-text-outline"
              onPress={() =>
                router.push(
                  "/(admin)/blogs"
                )
              }
            />

          </View>


          <View className="mb-3 w-[48.5%]">

            <QuickAction
              title="Manage Listings"
              icon="home-outline"
              onPress={() =>
                router.push(
                  "/(admin)/listings"
                )
              }
            />

          </View>


          <View className="mb-3 w-[48.5%]">

            <QuickAction
              title="View Leads"
              icon="people-outline"
              onPress={() =>
                router.push(
                  "/(admin)/leads"
                )
              }
            />

          </View>


          <View className="mb-3 w-[48.5%]">

            <QuickAction
              title="FAQs"
              icon="help-circle-outline"
              onPress={() =>
                router.push(
                  "/(admin)/faqs"
                )
              }
            />

          </View>


          <View className="mb-3 w-[48.5%]">

            <QuickAction
              title="Newsletter"
              icon="mail-outline"
              onPress={() =>
                router.push(
                  "/(admin)/subscriptions"
                )
              }
            />

          </View>


          <View className="mb-3 w-[48.5%]">

            <QuickAction
              title="Neighborhoods"
              icon="business-outline"
              onPress={() =>
                router.push(
                  "/(admin)/community"
                )
              }
            />

          </View>

        </View>


        {/* =================================================
                    OVERVIEW
                ================================================= */}

        <Text className="mb-3 mt-4 text-lg font-bold text-gray-900">
          Overview
        </Text>


        <View className="flex-row flex-wrap justify-between">

          {stats.map(
            (
              stat,
              index
            ) => (

              <View
                key={index}
                className="mb-4 w-[48.5%]"
              >

                <StatCard
                  {...stat}
                />

              </View>

            )
          )}

        </View>


        {/* =================================================
                    VISITOR ANALYTICS
                ================================================= */}

        <View className="mt-2 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

          <View className="border-b border-gray-100 p-5">

            <SectionHeader
              title="Website Visitors"
              description="Last 30 days traffic overview"
            />


            <View className="mt-4 flex-row">

              <View className="mr-2 flex-1 rounded-2xl bg-gray-100 p-3.5">

                <Text className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Total
                </Text>

                <Text className="mt-1 text-xl font-bold text-gray-900">
                  {(
                    visitorSummary
                      ?.total ||
                    0
                  ).toLocaleString()}
                </Text>

              </View>


              <View className="ml-2 flex-1 rounded-2xl bg-green-50 p-3.5">

                <Text className="text-[10px] font-semibold uppercase tracking-wider text-green-600">
                  Today
                </Text>

                <Text className="mt-1 text-xl font-bold text-green-700">
                  {(
                    visitorSummary
                      ?.today ||
                    0
                  ).toLocaleString()}
                </Text>

              </View>

            </View>


            <Pressable
              onPress={() =>
                setShowVisitorsModal(
                  true
                )
              }
              className="mt-3 rounded-2xl bg-[#A8794A] py-3.5 active:opacity-80"
            >

              <Text className="text-center text-sm font-semibold text-white">
                Show More
              </Text>

            </Pressable>

          </View>


          {/* CHART */}

          <View className="px-0 py-4">

            <LineChart
              data={{
                labels: chartLabels,
                datasets: [
                  {
                    data: chartValues,
                  },
                ],
              }}
              width={SCREEN_WIDTH - 32}
              height={270}
              bezier
              withInnerLines
              withOuterLines={false}
              withVerticalLines={false}
              fromZero
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: "#FFFFFF",
                backgroundGradientFrom: "#FFFFFF",
                backgroundGradientTo: "#FFFFFF",

                decimalPlaces: 0,

                color: (opacity = 1) =>
                  `rgba(184, 134, 11, ${opacity})`,

                labelColor: (opacity = 1) =>
                  `rgba(107, 114, 128, ${opacity})`,

                propsForDots: {
                  r: "3",
                  strokeWidth: "1",
                },

                propsForBackgroundLines: {
                  strokeDasharray: "3 3",
                  stroke: "#E5E7EB",
                },

                propsForLabels: {
                  fontSize: 10,
                },
              }}
              style={{
                marginLeft: -8,
                borderRadius: 20,
              }}
            />

          </View>

        </View>


        {/* =================================================
                    RECENT ACTIVITY
                ================================================= */}

        <View className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

          <View className="border-b border-gray-100 p-5">

            <SectionHeader
              title="Recent Activity"
              description="Latest updates across your system"
              action="Refresh"
              onAction={() =>
                fetchDashboardData(
                  true
                )
              }
            />

          </View>


          <View className="p-5">

            {recentActivity.length ===
              0 ? (

              <EmptyState
                icon="pulse-outline"
                text="No recent activity"
              />

            ) : (

              recentActivity.map(
                (
                  item,
                  index
                ) => (

                  <View
                    key={index}
                    className={`border-l-4 border-[#A8794A] pl-4 ${index <
                        recentActivity.length -
                        1
                        ? "mb-6"
                        : ""
                      }`}
                  >

                    <View className="flex-row items-center justify-between">

                      <View className="rounded-lg bg-[#A8794A]/10 px-2 py-1">

                        <Text className="text-[9px] font-bold uppercase text-[#A8794A]">
                          {
                            item.type
                          }
                        </Text>

                      </View>

                      <Text className="text-[10px] text-gray-400">
                        {formatDate(
                          item.date
                        )}
                      </Text>

                    </View>


                    <Text className="mt-2 text-sm leading-5 text-gray-700">
                      {
                        item.text
                      }
                    </Text>

                  </View>

                )
              )

            )}

          </View>

        </View>


        {/* =================================================
                    SYSTEM STATUS
                ================================================= */}

        <View className="mt-5 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

          <View className="border-b border-gray-100 p-5">

            <SectionHeader
              title="System Status"
              description="Live backend service monitoring"
            />

          </View>


          <View className="p-5">

            <StatusItem
              label="Database"
              status={
                dbStatus
              }
            />

            <StatusItem
              label="Market API"
              status={
                marketApiStatus
              }
            />

            <StatusItem
              label="Blog API"
              status={
                blogApiStatus
              }
            />

            <StatusItem
              label="Subscriber System"
              status={
                subscriberStatus
              }
            />

            <StatusItem
              label="Lead System"
              status={
                leadStatus
              }
            />

          </View>

        </View>


        {/* =================================================
                    RECENT LEADS
                ================================================= */}

        <View className="mt-5 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

          <View className="border-b border-gray-100 p-5">

            <SectionHeader
              title="Recent Leads"
              description="Latest customer inquiries and contact requests"
              action="View All"
              onAction={() =>
                router.push(
                  "/(admin)/leads"
                )
              }
            />

          </View>


          <View className="p-4">

            {recentLeads.length ===
              0 ? (

              <EmptyState
                icon="people-outline"
                text="No recent leads"
              />

            ) : (

              recentLeads
                .slice(
                  0,
                  10
                )
                .map(
                  (
                    lead,
                    index
                  ) => (

                    <View
                      key={index}
                      className="mb-3 rounded-2xl bg-gray-50 p-4"
                    >

                      <View className="flex-row items-start">

                        <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-[#A8794A]/10">

                          <Ionicons
                            name="person-outline"
                            size={19}
                            color="#A8794A"
                          />

                        </View>


                        <View className="flex-1">

                          <View className="flex-row items-start justify-between">

                            <Text
                              numberOfLines={
                                1
                              }
                              className="mr-2 flex-1 font-semibold text-gray-900"
                            >
                              {
                                lead.email
                              }
                            </Text>


                            <View className="rounded-full bg-[#A8794A]/10 px-2.5 py-1">

                              <Text className="text-[9px] font-bold text-[#A8794A]">
                                {
                                  lead.classification_tag ||
                                  "Lead"
                                }
                              </Text>

                            </View>

                          </View>


                          <Text className="mt-1 text-sm text-gray-500">
                            {
                              lead.phone ||
                              "No phone number"
                            }
                          </Text>


                          <Text className="mt-2 text-[10px] text-gray-400">
                            {formatDate(
                              lead.createdAt
                            )}
                          </Text>

                        </View>

                      </View>

                    </View>

                  )
                )

            )}

          </View>

        </View>

      </ScrollView>


      {/* =====================================================
                VISITOR ANALYTICS MODAL
            ===================================================== */}

      <Modal
        visible={
          showVisitorsModal
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowVisitorsModal(
            false
          )
        }
      >

        <View className="flex-1 justify-end bg-black/60">

          <View className="max-h-[92%] rounded-t-[32px] bg-white">

            {/* HEADER */}

            <View className="flex-row items-center justify-between border-b border-gray-100 px-5 py-5">

              <View className="mr-3 flex-1">

                <Text className="text-xl font-bold text-gray-900">
                  Visitor Analytics
                </Text>

                <Text className="mt-1 text-sm text-gray-500">
                  Website visitor overview
                </Text>

              </View>


              <Pressable
                onPress={() =>
                  setShowVisitorsModal(
                    false
                  )
                }
                className="h-10 w-10 items-center justify-center rounded-xl bg-gray-100 active:bg-gray-200"
              >

                <Ionicons
                  name="close"
                  size={22}
                  color="#4B5563"
                />

              </Pressable>

            </View>


            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
              contentContainerClassName="p-5 pb-10"
            >

              {/* =================================
                                SUMMARY
                            ================================= */}

              <View>

                <VisitorSummaryCard
                  title="Today"
                  value={
                    visitorSummary
                      ?.today ||
                    0
                  }
                  description="Visitors today"
                  bg="bg-green-50"
                  border="border-green-200"
                  titleColor="text-green-700"
                  valueColor="text-green-800"
                  descriptionColor="text-green-700"
                />


                <View className="mt-3">

                  <VisitorSummaryCard
                    title="This Week"
                    value={
                      visitorSummary
                        ?.week ||
                      0
                    }
                    description="Last 7 days visitors"
                    bg="bg-blue-50"
                    border="border-blue-200"
                    titleColor="text-blue-700"
                    valueColor="text-blue-800"
                    descriptionColor="text-blue-700"
                  />

                </View>


                <View className="mt-3">

                  <VisitorSummaryCard
                    title="This Month"
                    value={
                      visitorSummary
                        ?.month ||
                      0
                    }
                    description="Monthly traffic"
                    bg="bg-orange-50"
                    border="border-orange-200"
                    titleColor="text-orange-700"
                    valueColor="text-orange-800"
                    descriptionColor="text-orange-700"
                  />

                </View>


                <View className="mt-3">

                  <VisitorSummaryCard
                    title="This Year"
                    value={
                      visitorSummary
                        ?.year ||
                      0
                    }
                    description="Yearly visitors"
                    bg="bg-purple-50"
                    border="border-purple-200"
                    titleColor="text-purple-700"
                    valueColor="text-purple-800"
                    descriptionColor="text-purple-700"
                  />

                </View>

              </View>


              {/* =================================
                                TOP COUNTRIES
                            ================================= */}

              <View className="mt-5 overflow-hidden rounded-3xl border border-gray-200 bg-white">

                <View className="flex-row items-center justify-between border-b border-gray-100 p-5">

                  <View className="flex-1">

                    <Text className="text-base font-bold text-gray-900">
                      Top Countries
                    </Text>

                    <Text className="mt-1 text-xs text-gray-500">
                      Most visits by country
                    </Text>

                  </View>

                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#A8794A]/10">

                    <Text className="text-lg">
                      🌍
                    </Text>

                  </View>

                </View>


                <View className="p-5">

                  {topCountries.length ===
                    0 ? (

                    <EmptyState
                      icon="globe-outline"
                      text="No country data yet"
                    />

                  ) : (

                    topCountries.map(
                      (
                        country,
                        index
                      ) => {

                        const max =
                          topCountries[0]
                            ?.visitors ||
                          1;

                        const percentage =
                          Math.min(
                            100,
                            Math.round(
                              (
                                country.visitors /
                                max
                              ) *
                              100
                            )
                          );

                        return (

                          <View
                            key={`${country.countryCode}-${index}`}
                            className={`flex-row items-center ${index <
                                topCountries.length -
                                1
                                ? "mb-5"
                                : ""
                              }`}
                          >

                            <Text className="w-5 text-center text-xs font-bold text-gray-400">
                              {
                                index +
                                1
                              }
                            </Text>


                            <View className="ml-2 h-9 w-9 items-center justify-center rounded-xl border border-gray-100 bg-gray-50">

                              <Text className="text-lg">
                                {getCountryFlag(
                                  country.countryCode
                                )}
                              </Text>

                            </View>


                            <View className="ml-3 flex-1">

                              <View className="flex-row items-center justify-between">

                                <Text
                                  numberOfLines={
                                    1
                                  }
                                  className="mr-2 flex-1 text-sm font-semibold text-gray-800"
                                >
                                  {
                                    country.country
                                  }
                                </Text>

                                <Text className="text-sm font-bold text-gray-900">
                                  {country.visitors.toLocaleString()}
                                </Text>

                              </View>


                              <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">

                                <View
                                  className="h-full rounded-full bg-[#A8794A]"
                                  style={{
                                    width:
                                      `${percentage}%`,
                                  }}
                                />

                              </View>

                            </View>

                          </View>

                        );

                      }
                    )

                  )}

                </View>

              </View>


              {/* =================================
                                DEVICES
                            ================================= */}

              <View className="mt-5 overflow-hidden rounded-3xl border border-gray-200 bg-white">

                <View className="flex-row items-center justify-between border-b border-gray-100 p-5">

                  <View className="flex-1">

                    <Text className="text-base font-bold text-gray-900">
                      Devices
                    </Text>

                    <Text className="mt-1 text-xs text-gray-500">
                      Devices used by visitors
                    </Text>

                  </View>

                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#A8794A]/10">

                    <Text className="text-lg">
                      💻
                    </Text>

                  </View>

                </View>


                <View className="p-5">

                  {deviceStats.length ===
                    0 ? (

                    <EmptyState
                      icon="phone-portrait-outline"
                      text="No device data yet"
                    />

                  ) : (

                    deviceStats.map(
                      (
                        device,
                        index
                      ) => {

                        const total =
                          deviceStats.reduce(
                            (
                              sum,
                              item
                            ) =>
                              sum +
                              item.visitors,
                            0
                          );

                        const percentage =
                          total >
                            0
                            ? Math.round(
                              (
                                device.visitors /
                                total
                              ) *
                              100
                            )
                            : 0;


                        let icon:
                          keyof typeof Ionicons.glyphMap =
                          "help-circle-outline";

                        if (
                          device.device ===
                          "Desktop"
                        ) {

                          icon =
                            "desktop-outline";

                        } else if (
                          device.device ===
                          "Mobile"
                        ) {

                          icon =
                            "phone-portrait-outline";

                        } else if (
                          device.device ===
                          "Tablet"
                        ) {

                          icon =
                            "tablet-portrait-outline";

                        }


                        return (

                          <View
                            key={`${device.device}-${index}`}
                            className={`flex-row items-center ${index <
                                deviceStats.length -
                                1
                                ? "mb-5"
                                : ""
                              }`}
                          >

                            <View className="h-11 w-11 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50">

                              <Ionicons
                                name={
                                  icon
                                }
                                size={
                                  21
                                }
                                color="#6B7280"
                              />

                            </View>


                            <View className="ml-4 flex-1">

                              <View className="flex-row items-center justify-between">

                                <View className="flex-1">

                                  <Text className="text-sm font-semibold text-gray-800">
                                    {
                                      device.device
                                    }
                                  </Text>

                                  <Text className="mt-0.5 text-xs text-gray-400">
                                    {
                                      percentage
                                    }
                                    % of visits
                                  </Text>

                                </View>

                                <Text className="text-sm font-bold text-gray-900">
                                  {device.visitors.toLocaleString()}
                                </Text>

                              </View>


                              <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">

                                <View
                                  className="h-full rounded-full bg-gray-800"
                                  style={{
                                    width:
                                      `${percentage}%`,
                                  }}
                                />

                              </View>

                            </View>

                          </View>

                        );

                      }
                    )

                  )}

                </View>

              </View>


              {/* CLOSE */}

              <Pressable
                onPress={() =>
                  setShowVisitorsModal(
                    false
                  )
                }
                className="mt-5 rounded-2xl bg-gray-900 py-4 active:bg-[#A8794A]"
              >

                <Text className="text-center font-semibold text-white">
                  Close
                </Text>

              </Pressable>

            </ScrollView>

          </View>

        </View>

      </Modal>

    </View>
  );
}