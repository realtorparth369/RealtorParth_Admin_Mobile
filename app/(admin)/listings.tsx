import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

import axios from "axios";

import {
  Ionicons,
} from "@expo/vector-icons";

import QRCode from "react-native-qrcode-svg";


/* =========================================================
   CONFIG
========================================================= */

const API_URL =
  "https://realtorparth.ca";

const OFFICE_KEY =
  "282923";

const PAGE_SIZE = 10;


/* =========================================================
   TYPES
========================================================= */

interface ListingMedia {
  MediaURL: string;
}

interface Listing {
  ListingKey: string;
  UnparsedAddress: string;
  City: string;
  StateOrProvince?: string;
  ListPrice: number;
  PropertySubType: string;
  Media?: ListingMedia[];
  isSelected?: boolean;

  // Allow all additional MLS fields
  [key: string]: any;
}


// const formatPropertyLabel = (key: string) => {
//   return key
//     .replace(/([a-z])([A-Z])/g, "$1 $2")
//     .replace(/_/g, " ")
//     .replace(/-/g, " ")
//     .replace(/\b\w/g, (char) =>
//       char.toUpperCase()
//     );
// };

// const formatPropertyValue = (
//   value: any
// ): string => {
//   if (
//     value === null ||
//     value === undefined ||
//     value === ""
//   ) {
//     return "N/A";
//   }

//   if (typeof value === "boolean") {
//     return value ? "Yes" : "No";
//   }

//   if (Array.isArray(value)) {
//     return value
//       .map((item) => {
//         if (
//           typeof item === "object" &&
//           item !== null
//         ) {
//           return JSON.stringify(item);
//         }

//         return String(item);
//       })
//       .join(", ");
//   }

//   if (typeof value === "object") {
//     return JSON.stringify(
//       value,
//       null,
//       2
//     );
//   }

//   return String(value);
// };



const isValidPropertyValue = (value: any) => {
  if (
    value === null ||
    value === undefined
  ) {
    return false;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    return (
      normalized !== "" &&
      normalized !== "n/a" &&
      normalized !== "na" &&
      normalized !== "null" &&
      normalized !== "undefined" &&
      normalized !== "-"
    );
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
};

const formatPropertyLabel = (key: string) => {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};

const formatPropertyValue = (value: any): string => {
  if (Array.isArray(value)) {
    return value
      .filter(isValidPropertyValue)
      .map((item) =>
        typeof item === "object"
          ? JSON.stringify(item)
          : String(item)
      )
      .join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }

  return String(value);
};

/* =========================================================
   SCREEN
========================================================= */

export default function ListingsScreen() {

  /* =======================================================
     STATE
  ======================================================= */

  const [listings, setListings] =
    useState<Listing[]>([]);

  const [selected, setSelected] =
    useState<string[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [visibleCount, setVisibleCount] =
    useState(PAGE_SIZE);

  const [qrOpen, setQrOpen] =
    useState(false);

  const [qrListing, setQrListing] =
    useState<Listing | null>(null);

  const [activeProperty, setActiveProperty] =
    useState<Listing | null>(null);

  const [saving, setSaving] =
    useState(false);


  /* =======================================================
     FETCH LISTINGS
  ======================================================= */

  const fetchListings = async (
    showLoader = true
  ) => {

    try {

      if (showLoader) {
        setLoading(true);
      }

      const response =
        await axios.get(
          `${API_URL}/api/properties/office/admin/${OFFICE_KEY}`
        );

      const properties: Listing[] =
        Array.isArray(
          response.data?.properties
        )
          ? response.data.properties
          : [];

      setListings(properties);

      /*
       * Always start from first 10
       * after a fresh fetch.
       */
      setVisibleCount(
        PAGE_SIZE
      );

      /*
       * Restore selected properties
       * from API.
       */
      const preSelected =
        properties
          .filter(
            (property) =>
              property.isSelected
          )
          .map(
            (property) =>
              property.ListingKey
          );

      setSelected(preSelected);

    } catch (error) {

      console.error(
        "Failed to load listings:",
        error
      );

      Alert.alert(
        "Error",
        "Failed to load listings."
      );

    } finally {

      if (showLoader) {
        setLoading(false);
      }

    }
  };


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {

    fetchListings(true);

  }, []);


  /* =======================================================
     VISIBLE LISTINGS
  ======================================================= */

  const visibleListings =
    useMemo(() => {

      return listings.slice(
        0,
        visibleCount
      );

    }, [
      listings,
      visibleCount,
    ]);


  /* =======================================================
     HAS MORE
  ======================================================= */

  const hasMore =
    visibleCount <
    listings.length;


  /* =======================================================
     LOAD MORE
  ======================================================= */

  const handleLoadMore =
    () => {

      if (
        loadingMore ||
        !hasMore
      ) {
        return;
      }

      setLoadingMore(true);

      /*
       * Small timeout gives React Native
       * a chance to render the button/loading
       * state smoothly.
       */
      setTimeout(() => {

        setVisibleCount(
          (previous) =>
            Math.min(
              previous + PAGE_SIZE,
              listings.length
            )
        );

        setLoadingMore(false);

      }, 100);

    };


  /* =======================================================
     REFRESH
  ======================================================= */

  const onRefresh =
    useCallback(async () => {

      setRefreshing(true);

      try {

        await fetchListings(false);

      } finally {

        setRefreshing(false);

      }

    }, []);


  /* =======================================================
     TOGGLE SELECT
  ======================================================= */

  const toggleSelect =
    (key: string) => {

      setSelected(
        (previous) =>
          previous.includes(key)
            ? previous.filter(
              (item) =>
                item !== key
            )
            : [
              ...previous,
              key,
            ]
      );

    };


  /* =======================================================
     SELECT ALL
  ======================================================= */

  const handleSelectAll =
    () => {

      if (
        selected.length ===
        listings.length
      ) {

        setSelected([]);

        return;

      }

      setSelected(
        listings.map(
          (listing) =>
            listing.ListingKey
        )
      );

    };


  /* =======================================================
     SAVE SELECTED
  ======================================================= */

  const handleSaveSelected =
    async () => {

      if (
        selected.length === 0
      ) {
        return;
      }

      try {

        setSaving(true);

        await axios.post(
          `${API_URL}/api/properties/save-selected`,
          {
            selected,
          }
        );

        Alert.alert(
          "Success",
          "Selected properties saved."
        );

      } catch (error) {

        console.error(
          "Failed to save selection:",
          error
        );

        Alert.alert(
          "Error",
          "Failed to save selected properties."
        );

      } finally {

        setSaving(false);

      }

    };


  /* =======================================================
     OPEN QR
  ======================================================= */

  const openQr =
    (listing: Listing) => {

      setQrListing(listing);

      setQrOpen(true);

    };


  /* =======================================================
     CLOSE QR
  ======================================================= */

  const closeQr =
    () => {

      setQrOpen(false);

      setQrListing(null);

    };


  /* =======================================================
     OPEN PROPERTY
  ======================================================= */

  const openProperty =
    (listing: Listing) => {

      setActiveProperty(
        listing
      );

    };


  /* =======================================================
     CLOSE PROPERTY
  ======================================================= */

  const closeProperty =
    () => {

      setActiveProperty(
        null
      );

    };


  /* =======================================================
     INITIAL LOADING
  ======================================================= */

  if (loading) {

    return (
      <View className="flex-1 items-center justify-center bg-gray-100">

        <ActivityIndicator
          size="large"
          color="#A8794A"
        />

        <Text className="mt-3 text-gray-500">
          Loading listings...
        </Text>

      </View>
    );

  }


  /* =======================================================
     SCREEN
  ======================================================= */

  return (
    <>
      <ScrollView
        className="flex-1 bg-gray-100"
        contentContainerClassName="p-5 pb-10"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        showsVerticalScrollIndicator={
          false
        }
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <View className="flex-row items-center justify-between">

          <View className="flex-1">

            <Text className="text-2xl font-bold text-gray-900">
              Manage Listings
            </Text>

            <Text className="mt-1 text-gray-500">
              Manage MLS listings and featured properties.
            </Text>

          </View>


          <View className="ml-3 min-w-[65px] rounded-xl bg-white px-3 py-2">

            <Text className="text-center text-lg font-bold text-gray-900">
              {listings.length}
            </Text>

            <Text className="text-center text-xs text-gray-400">
              Listings
            </Text>

          </View>

        </View>


        {/* =================================================
            SELECT ALL
        ================================================= */}

        {listings.length > 0 && (

          <Pressable
            onPress={
              handleSelectAll
            }
            className="mt-5 flex-row items-center rounded-xl bg-white p-4"
          >

            <Ionicons
              name={
                selected.length ===
                  listings.length
                  ? "checkbox"
                  : "square-outline"
              }
              size={24}
              color="#A8794A"
            />

            <Text className="ml-3 flex-1 font-semibold text-gray-800">
              Select All
            </Text>

            <Text className="text-sm text-gray-400">
              {selected.length} selected
            </Text>

          </Pressable>

        )}


        {/* =================================================
            SHOWING COUNT
        ================================================= */}

        {listings.length > 0 && (

          <Text className="mt-4 text-sm text-gray-500">

            Showing{" "}
            <Text className="font-semibold text-gray-700">
              {Math.min(
                visibleCount,
                listings.length
              )}
            </Text>{" "}
            of{" "}
            <Text className="font-semibold text-gray-700">
              {listings.length}
            </Text>{" "}
            listings

          </Text>

        )}


        {/* =================================================
            LISTINGS
        ================================================= */}

        <View className="mt-3">

          {visibleListings.map(
            (listing) => {

              const isSelected =
                selected.includes(
                  listing.ListingKey
                );

              const imageUrl =
                listing.Media?.[0]?.MediaURL;


              return (

                <Pressable
                  key={
                    listing.ListingKey
                  }
                  onPress={() =>
                    openProperty(
                      listing
                    )
                  }
                  className={`mb-4 overflow-hidden rounded-2xl border bg-white ${isSelected
                    ? "border-bronze"
                    : "border-gray-100"
                    }`}
                >

                  {/* =====================================
                      PROPERTY IMAGE
                  ===================================== */}

                  {imageUrl ? (

                    <Image
                      source={{
                        uri: imageUrl,
                      }}
                      className="h-48 w-full"
                      resizeMode="cover"
                    />

                  ) : (

                    <View className="h-48 w-full items-center justify-center bg-gray-200">

                      <Ionicons
                        name="home-outline"
                        size={45}
                        color="#9ca3af"
                      />

                      <Text className="mt-2 text-gray-400">
                        No image available
                      </Text>

                    </View>

                  )}


                  {/* =====================================
                      CONTENT
                  ===================================== */}

                  <View className="p-4">

                    <View className="flex-row">

                      {/* CHECKBOX */}

                      <Pressable
                        onPress={(
                          event
                        ) => {

                          event.stopPropagation();

                          toggleSelect(
                            listing.ListingKey
                          );

                        }}
                        className="mr-3 pt-1"
                      >

                        <Ionicons
                          name={
                            isSelected
                              ? "checkbox"
                              : "square-outline"
                          }
                          size={25}
                          color={
                            isSelected
                              ? "#A8794A"
                              : "#9ca3af"
                          }
                        />

                      </Pressable>


                      {/* DETAILS */}

                      <View className="flex-1">

                        <Text
                          numberOfLines={2}
                          className="text-lg font-bold text-gray-900"
                        >
                          {
                            listing.UnparsedAddress
                          }
                        </Text>

                        <Text className="mt-1 text-gray-500">
                          {listing.City}

                          {listing.StateOrProvince
                            ? `, ${listing.StateOrProvince}`
                            : ""}
                        </Text>

                        <Text className="mt-2 text-xl font-bold text-green-600">
                          $
                          {listing.ListPrice?.toLocaleString()}
                        </Text>

                        <Text className="mt-1 text-sm text-gray-400">
                          {
                            listing.PropertySubType
                          }
                        </Text>

                      </View>

                    </View>


                    {/* ===================================
                        ACTIONS
                    =================================== */}

                    <View className="mt-4 flex-row justify-end border-t border-gray-100 pt-3">

                      {/* QR */}

                      <Pressable
                        onPress={(
                          event
                        ) => {

                          event.stopPropagation();

                          openQr(
                            listing
                          );

                        }}
                        className="mr-3 rounded-xl bg-bronze px-4 py-3"
                      >

                        <View className="flex-row items-center">

                          <Ionicons
                            name="qr-code-outline"
                            size={19}
                            color="#ffffff"
                          />

                          <Text className="ml-2 font-semibold text-white">
                            QR
                          </Text>

                        </View>

                      </Pressable>


                      {/* VIEW */}

                      <Pressable
                        onPress={() =>
                          openProperty(
                            listing
                          )
                        }
                        className="rounded-xl bg-gray-100 px-4 py-3"
                      >

                        <View className="flex-row items-center">

                          <Ionicons
                            name="eye-outline"
                            size={19}
                            color="#374151"
                          />

                          <Text className="ml-2 font-semibold text-gray-700">
                            View
                          </Text>

                        </View>

                      </Pressable>

                    </View>

                  </View>

                </Pressable>

              );

            }
          )}


          {/* =============================================
              EMPTY
          ============================================= */}

          {listings.length === 0 && (

            <View className="items-center rounded-2xl bg-white p-10">

              <Ionicons
                name="home-outline"
                size={45}
                color="#9ca3af"
              />

              <Text className="mt-3 text-lg font-semibold text-gray-700">
                No listings found
              </Text>

              <Text className="mt-1 text-center text-gray-400">
                No MLS listings are currently available.
              </Text>

            </View>

          )}

        </View>


        {/* =================================================
            LOAD MORE
        ================================================= */}

        {hasMore && (

          <Pressable
            onPress={
              handleLoadMore
            }
            disabled={
              loadingMore
            }
            className="mt-2 items-center rounded-xl border border-bronze bg-white py-4"
          >

            <View className="flex-row items-center">

              {loadingMore ? (

                <ActivityIndicator
                  size="small"
                  color="#A8794A"
                />

              ) : (

                <Ionicons
                  name="chevron-down"
                  size={20}
                  color="#A8794A"
                />

              )}

              <Text className="ml-2 font-bold text-bronze">

                {loadingMore
                  ? "Loading..."
                  : `Load More (${Math.min(
                    PAGE_SIZE,
                    listings.length -
                    visibleCount
                  )})`}

              </Text>

            </View>

          </Pressable>

        )}


        {/* =================================================
            ALL LOADED
        ================================================= */}

        {listings.length > 0 &&
          !hasMore && (

            <View className="mt-3 items-center">

              <Text className="text-sm text-gray-400">
                All listings loaded
              </Text>

            </View>

          )}


        {/* =================================================
            SAVE SELECTED
        ================================================= */}

        <Pressable
          onPress={
            handleSaveSelected
          }
          disabled={
            selected.length === 0 ||
            saving
          }
          className={`mt-5 items-center rounded-xl px-5 py-4 ${selected.length === 0 ||
            saving
            ? "bg-gray-300"
            : "bg-bronze"
            }`}
        >

          <View className="flex-row items-center">

            {saving ? (

              <ActivityIndicator
                size="small"
                color="#ffffff"
              />

            ) : (

              <Ionicons
                name="save-outline"
                size={20}
                color="#ffffff"
              />

            )}

            <Text className="ml-2 font-bold text-white">

              {saving
                ? "Saving..."
                : `Save ${selected.length} Selected`}

            </Text>

          </View>

        </Pressable>

      </ScrollView>


      {/* ===================================================
          QR MODAL
      =================================================== */}

      <Modal
        visible={qrOpen}
        transparent
        animationType="fade"
        onRequestClose={
          closeQr
        }
      >

        <View className="flex-1 items-center justify-center bg-black/50 px-5">

          <View className="w-full max-w-md overflow-hidden rounded-3xl bg-white">

            {/* =============================================
                IMAGE
            ============================================= */}

            {qrListing?.Media?.[0]?.MediaURL ? (

              <Image
                source={{
                  uri:
                    qrListing.Media[0]
                      .MediaURL,
                }}
                className="h-48 w-full"
                resizeMode="cover"
              />

            ) : (

              <View className="h-48 w-full items-center justify-center bg-gray-200">

                <Ionicons
                  name="home-outline"
                  size={50}
                  color="#9ca3af"
                />

              </View>

            )}


            {/* =============================================
                CONTENT
            ============================================= */}

            <View className="p-6">

              <View className="flex-row items-start justify-between">

                <View className="flex-1 pr-3">

                  <Text className="text-xl font-bold text-gray-900">
                    {
                      qrListing?.UnparsedAddress
                    }
                  </Text>

                  <Text className="mt-1 text-gray-500">
                    {qrListing?.City}

                    {qrListing?.StateOrProvince
                      ? `, ${qrListing.StateOrProvince}`
                      : ""}
                  </Text>

                </View>


                <Pressable
                  onPress={
                    closeQr
                  }
                  className="rounded-full bg-gray-100 p-2"
                >

                  <Ionicons
                    name="close"
                    size={21}
                    color="#374151"
                  />

                </Pressable>

              </View>


              {/* QR CODE */}

              <View className="mt-6 items-center">

                <View className="rounded-2xl border border-amber-200 bg-gray-50 p-5">

                  {qrListing && (

                    <QRCode
                      value={
                        `${API_URL}/property-qr/${qrListing.ListingKey}`
                      }
                      size={190}
                      backgroundColor="#ffffff"
                      color="#A8794A"
                    />

                  )}

                </View>

              </View>


              {/* PROPERTY INFO */}

              <Text className="mt-5 text-center text-gray-500">
                {
                  qrListing?.PropertySubType
                }
              </Text>

              <Text className="mt-1 text-center text-xl font-bold text-green-600">
                $
                {
                  qrListing?.ListPrice?.toLocaleString()
                }
              </Text>


              {/* CLOSE */}

              <Pressable
                onPress={
                  closeQr
                }
                className="mt-6 items-center rounded-xl bg-gray-800 py-3"
              >

                <Text className="font-bold text-white">
                  Close
                </Text>

              </Pressable>

            </View>

          </View>

        </View>

      </Modal>


      {/* ===================================================
    PROPERTY DETAILS MODAL
=================================================== */}
      {/* ===================================================
    PROPERTY DETAILS MODAL
=================================================== */}

      <Modal
        visible={activeProperty !== null}
        transparent
        animationType="slide"
        onRequestClose={closeProperty}
      >
        <View className="flex-1 justify-end bg-black/50">

          <View className="h-[92%] overflow-hidden rounded-t-3xl bg-white">

            {/* =================================================
          HEADER
      ================================================= */}

            <View className="border-b border-gray-200 bg-white px-5 py-4">

              <View className="flex-row items-center justify-between">

                <View className="flex-1 pr-3">

                  <Text
                    numberOfLines={2}
                    className="text-xl font-bold text-gray-900"
                  >
                    {activeProperty?.UnparsedAddress ||
                      "Property Details"}
                  </Text>

                  {isValidPropertyValue(
                    activeProperty?.City
                  ) && (
                      <Text className="mt-1 text-sm text-gray-500">
                        {activeProperty?.City}

                        {isValidPropertyValue(
                          activeProperty?.StateOrProvince
                        )
                          ? `, ${activeProperty?.StateOrProvince}`
                          : ""}
                      </Text>
                    )}

                </View>

                <Pressable
                  onPress={closeProperty}
                  className="rounded-full bg-gray-100 p-2"
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color="#374151"
                  />
                </Pressable>

              </View>

            </View>


            {/* =================================================
          SCROLLABLE CONTENT
      ================================================= */}

            <ScrollView
              className="flex-1"
              contentContainerStyle={{
                padding: 16,
                paddingBottom: 35,
              }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >

              {/* =================================================
            IMAGE CAROUSEL
        ================================================= */}

              {activeProperty?.Media?.some(
                (media) =>
                  isValidPropertyValue(
                    media?.MediaURL
                  )
              ) ? (

                <View className="mb-4">

                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    nestedScrollEnabled
                  >

                    {activeProperty.Media
                      ?.filter((media) =>
                        isValidPropertyValue(
                          media?.MediaURL
                        )
                      )
                      .map(
                        (media, index) => (

                          <View
                            key={`${media.MediaURL}-${index}`}
                            className="mr-3 overflow-hidden rounded-2xl"
                            style={{
                              width: 330,
                            }}
                          >

                            <Image
                              source={{
                                uri: media.MediaURL,
                              }}
                              className="h-52 w-full"
                              resizeMode="cover"
                            />

                          </View>

                        )
                      )}

                  </ScrollView>

                  {/* IMAGE COUNT */}

                  {activeProperty.Media.length >
                    1 && (
                      <View className="mt-2 items-center">

                        <View className="rounded-full bg-gray-100 px-3 py-1">

                          <Text className="text-xs font-medium text-gray-500">
                            {activeProperty.Media.length} photos
                          </Text>

                        </View>

                      </View>
                    )}

                </View>

              ) : (

                <View className="mb-4 h-52 w-full items-center justify-center rounded-2xl bg-gray-100">

                  <Ionicons
                    name="home-outline"
                    size={50}
                    color="#9ca3af"
                  />

                  <Text className="mt-2 text-sm text-gray-400">
                    No image available
                  </Text>

                </View>

              )}


              {/* =================================================
            PRICE + TYPE
        ================================================= */}

              <View className="mb-4 flex-row gap-3">

                {/* PRICE */}

                {isValidPropertyValue(
                  activeProperty?.ListPrice
                ) && (

                    <View className="flex-1 rounded-2xl bg-green-50 p-4">

                      <Text className="text-xs font-medium uppercase text-green-700">
                        List Price
                      </Text>

                      <Text className="mt-1 text-2xl font-bold text-green-600">
                        $
                        {Number(
                          activeProperty?.ListPrice
                        ).toLocaleString()}
                      </Text>

                    </View>

                  )}


                {/* PROPERTY TYPE */}

                {isValidPropertyValue(
                  activeProperty?.PropertySubType
                ) && (

                    <View className="flex-1 rounded-2xl bg-gray-50 p-4">

                      <Text className="text-xs font-medium uppercase text-gray-400">
                        Property Type
                      </Text>

                      <Text
                        numberOfLines={2}
                        className="mt-1 text-sm font-bold text-gray-800"
                      >
                        {activeProperty?.PropertySubType}
                      </Text>

                    </View>

                  )}

              </View>


              {/* =================================================
            PROPERTY DETAILS
        ================================================= */}

              <View className="mb-5 rounded-2xl border border-gray-200 bg-white">

                {/* TITLE */}

                <View className="border-b border-gray-100 px-4 py-3">

                  <Text className="text-base font-bold text-gray-900">
                    Property Details
                  </Text>

                </View>


                {/* DETAILS GRID */}

                <View className="flex-row flex-wrap px-2 py-2">

                  {activeProperty &&

                    Object.entries(activeProperty)
                      .filter(
                        ([key, value]) => {

                          // Don't display these
                          if (
                            key === "Media" ||
                            key === "isSelected" ||
                            key === "ListingKey"
                          ) {
                            return false;
                          }

                          return isValidPropertyValue(
                            value
                          );
                        }
                      )
                      .map(
                        ([key, value]) => {

                          const formattedValue =
                            formatPropertyValue(
                              value
                            );

                          if (
                            !isValidPropertyValue(
                              formattedValue
                            )
                          ) {
                            return null;
                          }

                          return (

                            <View
                              key={key}
                              className="w-1/2 p-2"
                            >

                              <View className="rounded-xl bg-gray-50 p-3">

                                <Text
                                  numberOfLines={1}
                                  className="text-[11px] font-medium text-gray-400"
                                >
                                  {formatPropertyLabel(
                                    key
                                  )}
                                </Text>

                                <Text
                                  numberOfLines={3}
                                  className="mt-1 text-sm font-semibold leading-5 text-gray-800"
                                >
                                  {formattedValue}
                                </Text>

                              </View>

                            </View>

                          );
                        }
                      )}

                </View>

              </View>


              {/* =================================================
            LISTING KEY - SMALL
        ================================================= */}

              {isValidPropertyValue(
                activeProperty?.ListingKey
              ) && (

                  <View className="mb-4 flex-row items-center justify-between rounded-xl bg-gray-50 px-4 py-3">

                    <Text className="text-xs text-gray-400">
                      MLS Listing
                    </Text>

                    <Text
                      numberOfLines={1}
                      className="ml-3 flex-1 text-right text-xs font-semibold text-gray-700"
                    >
                      {activeProperty?.ListingKey}
                    </Text>

                  </View>

                )}


              {/* =================================================
            SELECT
        ================================================= */}

              {activeProperty && (

                <Pressable
                  onPress={() =>
                    toggleSelect(
                      activeProperty.ListingKey
                    )
                  }
                  className={`mb-3 items-center rounded-xl py-4 ${selected.includes(
                    activeProperty.ListingKey
                  )
                      ? "bg-gray-200"
                      : "bg-bronze"
                    }`}
                >

                  <View className="flex-row items-center">

                    <Ionicons
                      name={
                        selected.includes(
                          activeProperty.ListingKey
                        )
                          ? "checkbox"
                          : "add-circle-outline"
                      }
                      size={20}
                      color={
                        selected.includes(
                          activeProperty.ListingKey
                        )
                          ? "#374151"
                          : "#ffffff"
                      }
                    />

                    <Text
                      className={`ml-2 font-bold ${selected.includes(
                        activeProperty.ListingKey
                      )
                          ? "text-gray-700"
                          : "text-white"
                        }`}
                    >
                      {selected.includes(
                        activeProperty.ListingKey
                      )
                        ? "Remove from Selected"
                        : "Add to Selected"}
                    </Text>

                  </View>

                </Pressable>

              )}


              {/* =================================================
            CLOSE
        ================================================= */}

              <Pressable
                onPress={closeProperty}
                className="items-center rounded-xl bg-gray-800 py-4"
              >

                <View className="flex-row items-center">

                  <Ionicons
                    name="close-circle-outline"
                    size={20}
                    color="#ffffff"
                  />

                  <Text className="ml-2 font-bold text-white">
                    Close
                  </Text>

                </View>

              </Pressable>

            </ScrollView>

          </View>

        </View>
      </Modal>

    </>
  );
}