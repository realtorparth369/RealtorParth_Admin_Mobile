import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";

import axios from "axios";

import {
  Download,
  Filter,
  Phone,
  Search,
  Trash2,
  X,
} from "lucide-react-native";

import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";


/* =========================================================
   TYPES
========================================================= */

interface Lead {
  _id: string;
  email: string;
  phone?: string;
  chat_summary: string;
  classification_tag: string;
  createdAt: string;
}

type SortType = "newest" | "oldest";

type Filters = {
  status: string;
  hasPhone: string;
  sort: SortType;
};


/* =========================================================
   CONFIG
========================================================= */

const API_URL = "https://realtorparth.ca";


/* =========================================================
   STATUS OPTIONS
========================================================= */

const STATUS_OPTIONS = [
  {
    value: "",
    label: "All",
  },
  {
    value: "buyer",
    label: "Buyer",
  },
  {
    value: "seller",
    label: "Seller",
  },
  {
    value: "investor",
    label: "Investor",
  },
  {
    value: "hot_lead",
    label: "Hot Lead",
  },
];


/* =========================================================
   COMPONENT
========================================================= */

export default function LeadsScreen() {

  /* =======================================================
     STATE
  ======================================================= */

  const [leads, setLeads] = useState<Lead[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [showFilter, setShowFilter] =
    useState(false);

  const [filters, setFilters] =
    useState<Filters>({
      status: "",
      hasPhone: "",
      sort: "newest",
    });

  const [tempFilters, setTempFilters] =
    useState<Filters>({
      status: "",
      hasPhone: "",
      sort: "newest",
    });

  const [selectedLead, setSelectedLead] =
    useState<Lead | null>(null);

  const [showModal, setShowModal] =
    useState(false);

  const [editStatus, setEditStatus] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [exporting, setExporting] =
    useState(false);


  /* =======================================================
     FETCH LEADS
  ======================================================= */

  const fetchLeads = useCallback(
    async (showLoader = true) => {
      try {

        if (showLoader) {
          setLoading(true);
        }

        const res = await axios.get(
          `${API_URL}/api/contact`
        );

        if (res.data) {
          setLeads(
            Array.isArray(res.data.data)
              ? res.data.data
              : []
          );
        } else {
          setLeads([]);
        }

      } catch (error) {

        console.error(
          "Error fetching leads:",
          error
        );

        Alert.alert(
          "Error",
          "Failed to load leads."
        );

      } finally {

        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );


  /* =======================================================
     INITIAL FETCH
  ======================================================= */

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);


  /* =======================================================
     REFRESH
  ======================================================= */

  const handleRefresh = () => {

    setRefreshing(true);

    fetchLeads(false);
  };


  /* =======================================================
     FILTERED LEADS
  ======================================================= */

  const filteredLeads = useMemo(() => {

    const search =
      searchTerm
        .trim()
        .toLowerCase();

    return [...leads]

      .filter((lead) => {

        const matchesSearch =
          !search ||
          lead.email
            ?.toLowerCase()
            .includes(search) ||
          lead.phone
            ?.toLowerCase()
            .includes(search) ||
          lead.chat_summary
            ?.toLowerCase()
            .includes(search) ||
          lead.classification_tag
            ?.toLowerCase()
            .includes(search);

        const matchesStatus =
          !filters.status ||
          lead.classification_tag ===
            filters.status;

        let matchesPhone = true;

        if (
          filters.hasPhone === "yes"
        ) {
          matchesPhone = Boolean(
            lead.phone &&
            lead.phone.trim()
          );
        }

        if (
          filters.hasPhone === "no"
        ) {
          matchesPhone = !(
            lead.phone &&
            lead.phone.trim()
          );
        }

        return (
          matchesSearch &&
          matchesStatus &&
          matchesPhone
        );
      })

      .sort((a, b) => {

        const dateA =
          new Date(
            a.createdAt
          ).getTime();

        const dateB =
          new Date(
            b.createdAt
          ).getTime();

        return filters.sort ===
          "newest"
          ? dateB - dateA
          : dateA - dateB;
      });

  }, [
    leads,
    searchTerm,
    filters,
  ]);


  /* =======================================================
     STATUS STYLE
  ======================================================= */

  const getStatusStyle = (
    tag: string
  ) => {

    switch (tag) {

      case "hot_lead":
        return {
          background:
            "bg-red-100",
          text:
            "text-red-700",
        };

      case "buyer":
        return {
          background:
            "bg-blue-100",
          text:
            "text-blue-700",
        };

      case "investor":
        return {
          background:
            "bg-purple-100",
          text:
            "text-purple-700",
        };

      case "seller":
        return {
          background:
            "bg-yellow-100",
          text:
            "text-yellow-700",
        };

      default:
        return {
          background:
            "bg-gray-100",
          text:
            "text-gray-700",
        };
    }
  };


  /* =======================================================
     STATUS LABEL
  ======================================================= */

  const getStatusLabel = (
    tag: string
  ) => {

    switch (tag) {

      case "hot_lead":
        return "HOT LEAD";

      case "buyer":
        return "BUYER";

      case "seller":
        return "SELLER";

      case "investor":
        return "INVESTOR";

      default:
        return tag
          ?.replace(
            /_/g,
            " "
          )
          .toUpperCase();
    }
  };


  /* =======================================================
     OPEN LEAD
  ======================================================= */

  const openLead = (
    lead: Lead
  ) => {

    setSelectedLead(lead);

    setEditStatus(
      lead.classification_tag
    );

    setShowModal(true);
  };


  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const closeModal = () => {

    if (
      saving ||
      deleting
    ) {
      return;
    }

    setShowModal(false);

    setSelectedLead(null);
  };


  /* =======================================================
     UPDATE LEAD
  ======================================================= */

  const handleUpdate =
    async () => {

      if (!selectedLead) {
        return;
      }

      try {

        setSaving(true);

        await axios.put(
          `${API_URL}/api/contact/${selectedLead._id}`,
          {
            classification_tag:
              editStatus,
          }
        );

        Alert.alert(
          "Success",
          "Lead status updated successfully."
        );

        setShowModal(false);

        setSelectedLead(null);

        await fetchLeads(false);

      } catch (error) {

        console.error(
          "Update lead error:",
          error
        );

        Alert.alert(
          "Error",
          "Failed to update lead."
        );

      } finally {

        setSaving(false);
      }
    };


  /* =======================================================
     DELETE LEAD
  ======================================================= */

  const handleDelete = () => {

    if (!selectedLead) {
      return;
    }

    Alert.alert(
      "Delete Lead",
      "Are you sure you want to delete this lead?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Delete",
          style: "destructive",

          onPress:
            async () => {

              try {

                setDeleting(true);

                await axios.delete(
                  `${API_URL}/api/contact/${selectedLead._id}`
                );

                Alert.alert(
                  "Success",
                  "Lead deleted successfully."
                );

                setShowModal(false);

                setSelectedLead(null);

                await fetchLeads(
                  false
                );

              } catch (error) {

                console.error(
                  "Delete lead error:",
                  error
                );

                Alert.alert(
                  "Error",
                  "Failed to delete lead."
                );

              } finally {

                setDeleting(false);
              }
            },
        },
      ]
    );
  };


  /* =======================================================
     CSV ESCAPE
  ======================================================= */

  const escapeCSV = (
    value: unknown
  ): string => {

    return `"${String(
      value ?? ""
    )
      .replace(
        /"/g,
        '""'
      )
      .replace(
        /\r?\n|\r/g,
        " "
      )}"`;
  };


  /* =======================================================
     EXPORT CSV
  ======================================================= */

  const handleExportCSV =
    async () => {

      if (
        !filteredLeads.length
      ) {

        Alert.alert(
          "No Data",
          "There are no leads to export."
        );

        return;
      }

      try {

        setExporting(true);

        /* ===============================================
           CSV HEADERS
        =============================================== */

        const headers = [
          "Email",
          "Phone",
          "Message",
          "Status",
          "Created Date",
        ];


        /* ===============================================
           CSV ROWS
        =============================================== */

        const rows =
          filteredLeads.map(
            (lead) => {

              return [
                lead.email,
                lead.phone || "",
                lead.chat_summary ||
                  "",
                lead.classification_tag ||
                  "",
                new Date(
                  lead.createdAt
                ).toLocaleString(),
              ]
                .map(
                  escapeCSV
                )
                .join(",");
            }
          );


        /* ===============================================
           CSV CONTENT
        =============================================== */

        const csvContent = [
          headers
            .map(
              escapeCSV
            )
            .join(","),

          ...rows,

        ].join("\n");


        /* ===============================================
           FILE NAME
        =============================================== */

        const date =
          new Date()
            .toISOString()
            .split("T")[0];

        const fileName =
          `leads-${date}.csv`;


        /* ===============================================
           FILE URI
        =============================================== */

        const fileUri =
          `${FileSystem.cacheDirectory}${fileName}`;


        /* ===============================================
           WRITE FILE
        =============================================== */

        await FileSystem.writeAsStringAsync(
          fileUri,
          csvContent,
          {
            encoding:
              FileSystem.EncodingType.UTF8,
          }
        );


        /* ===============================================
           CHECK SHARING
        =============================================== */

        const sharingAvailable =
          await Sharing.isAvailableAsync();


        if (!sharingAvailable) {

          Alert.alert(
            "Export Complete",
            `CSV file created successfully:\n\n${fileName}`
          );

          return;
        }


        /* ===============================================
           OPEN SHARE / SAVE SHEET
        =============================================== */

        await Sharing.shareAsync(
          fileUri,
          {
            mimeType:
              "text/csv",

            dialogTitle:
              "Export Leads CSV",

            UTI:
              "public.comma-separated-values-text",
          }
        );

      } catch (error) {

        console.error(
          "CSV export error:",
          error
        );

        Alert.alert(
          "Export Failed",
          "Unable to create the CSV file."
        );

      } finally {

        setExporting(false);
      }
    };


  /* =======================================================
     OPEN FILTER
  ======================================================= */

  const openFilter = () => {

    setTempFilters({
      ...filters,
    });

    setShowFilter(true);
  };


  /* =======================================================
     APPLY FILTER
  ======================================================= */

  const applyFilters = () => {

    setFilters({
      ...tempFilters,
    });

    setShowFilter(false);
  };


  /* =======================================================
     RESET FILTER
  ======================================================= */

  const resetFilters = () => {

    const reset: Filters = {
      status: "",
      hasPhone: "",
      sort: "newest",
    };

    setTempFilters(reset);

    setFilters(reset);
  };


  /* =======================================================
     ACTIVE FILTER COUNT
  ======================================================= */

  const activeFilterCount =
    Number(
      Boolean(filters.status)
    ) +
    Number(
      Boolean(filters.hasPhone)
    ) +
    Number(
      filters.sort !== "newest"
    );


  /* =======================================================
     LEAD CARD
  ======================================================= */

  const renderLead = ({
    item,
  }: {
    item: Lead;
  }) => {

    const statusStyle =
      getStatusStyle(
        item.classification_tag
      );

    return (

      <Pressable
        onPress={() =>
          openLead(item)
        }
        className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm active:bg-gray-50"
      >

        {/* ===============================================
            TOP
        =============================================== */}

        <View className="flex-row items-start justify-between gap-3">

          <View className="flex-1">

            <Text
              className="text-base font-semibold text-gray-900"
              numberOfLines={2}
            >
              {item.email}
            </Text>


            {item.phone ? (

              <View className="mt-1 flex-row items-center">

                <Phone
                  size={14}
                  color="#9ca3af"
                />

                <Text
                  className="ml-1 flex-1 text-sm text-gray-500"
                  numberOfLines={1}
                >
                  {item.phone}
                </Text>

              </View>

            ) : null}

          </View>


          <View
            className={`rounded-full px-3 py-1 ${statusStyle.background}`}
          >

            <Text
              className={`text-[10px] font-bold ${statusStyle.text}`}
            >
              {getStatusLabel(
                item.classification_tag
              )}
            </Text>

          </View>

        </View>


        {/* ===============================================
            SUMMARY
        =============================================== */}

        <View className="mt-4">

          <Text
            className="text-sm leading-5 text-gray-600"
            numberOfLines={3}
          >
            {item.chat_summary ||
              "No message available."}
          </Text>

        </View>


        {/* ===============================================
            FOOTER
        =============================================== */}

        <View className="mt-4 flex-row items-center justify-between">

          <Text className="text-xs text-gray-400">

            {new Date(
              item.createdAt
            ).toLocaleDateString()}

          </Text>


          <Text className="text-sm font-semibold text-bronze">

            View Details

          </Text>

        </View>

      </Pressable>
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
          Loading leads...
        </Text>

      </View>
    );
  }


  /* =======================================================
     MAIN
  ======================================================= */

  return (

    <View className="flex-1 bg-gray-100">

      {/* =================================================
          HEADER
      ================================================= */}

      <View className="px-5 pb-3 pt-5">

        <View className="flex-row items-start justify-between">

          <View className="flex-1">

            <Text className="text-2xl font-bold text-gray-900">
              Leads
            </Text>

            <Text className="mt-1 text-sm text-gray-500">
              Track and manage your potential clients.
            </Text>

          </View>


          {/* =============================================
              EXPORT BUTTON
          ============================================= */}

          <Pressable
            onPress={handleExportCSV}
            disabled={exporting}
            className={`ml-3 rounded-xl bg-bronze px-3 py-3 ${
              exporting
                ? "opacity-60"
                : "active:opacity-80"
            }`}
          >

            {exporting ? (

              <ActivityIndicator
                size="small"
                color="#ffffff"
              />

            ) : (

              <Download
                size={19}
                color="#ffffff"
              />

            )}

          </Pressable>

        </View>


        {/* =================================================
            SEARCH
        ================================================= */}

        <View className="mt-4 flex-row items-center rounded-xl border border-gray-200 bg-white px-3">

          <Search
            size={19}
            color="#9ca3af"
          />

          <TextInput
            value={searchTerm}
            onChangeText={
              setSearchTerm
            }
            placeholder="Search leads..."
            placeholderTextColor="#9ca3af"
            className="ml-2 flex-1 py-3 text-sm text-gray-900"
            autoCapitalize="none"
          />

          {searchTerm.length >
            0 && (

            <Pressable
              onPress={() =>
                setSearchTerm("")
              }
            >

              <X
                size={18}
                color="#9ca3af"
              />

            </Pressable>
          )}

        </View>


        {/* =================================================
            FILTER BUTTON
        ================================================= */}

        <View className="mt-3 flex-row items-center">

          <Pressable
            onPress={openFilter}
            className="flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3 active:bg-gray-50"
          >

            <Filter
              size={17}
              color="#A8794A"
            />

            <Text className="ml-2 font-medium text-gray-700">
              Filter
            </Text>


            {activeFilterCount >
              0 && (

              <View className="ml-2 min-w-[20px] items-center rounded-full bg-bronze px-1.5 py-0.5">

                <Text className="text-[10px] font-bold text-white">
                  {activeFilterCount}
                </Text>

              </View>
            )}

          </Pressable>


          <Text className="ml-auto text-sm text-gray-500">

            {filteredLeads.length}{" "}

            {filteredLeads.length ===
            1
              ? "lead"
              : "leads"}

          </Text>

        </View>

      </View>


      {/* =================================================
          LEADS LIST
      ================================================= */}

      <FlatList
        data={filteredLeads}
        keyExtractor={(item) =>
          item._id
        }
        renderItem={
          renderLead
        }
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 30,
        }}
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={

          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              handleRefresh
            }
            tintColor="#A8794A"
          />

        }
        ListEmptyComponent={

          <View className="mt-10 items-center rounded-2xl bg-white p-8">

            <Search
              size={35}
              color="#9ca3af"
            />

            <Text className="mt-4 text-base font-semibold text-gray-700">
              No leads found
            </Text>

            <Text className="mt-1 text-center text-sm text-gray-400">
              Try changing your search or filters.
            </Text>

          </View>

        }
      />


      {/* =================================================
          LEAD DETAILS MODAL
      ================================================= */}

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={
          closeModal
        }
      >

        <View className="flex-1 justify-end bg-black/50">

          <View className="max-h-[90%] rounded-t-3xl bg-white">

            {/* =============================================
                HEADER
            ============================================= */}

            <View className="flex-row items-center justify-between border-b border-gray-100 px-5 py-4">

              <Text className="text-xl font-bold text-gray-900">
                Lead Details
              </Text>

              <Pressable
                onPress={
                  closeModal
                }
                className="h-9 w-9 items-center justify-center rounded-full bg-gray-100"
              >

                <X
                  size={19}
                  color="#374151"
                />

              </Pressable>

            </View>


            {/* =============================================
                CONTENT
            ============================================= */}

            <View className="px-5 py-5">

              {/* CONTACT */}

              <View className="rounded-2xl bg-gray-50 p-4">

                <Text className="text-xs font-semibold uppercase text-gray-500">
                  Email
                </Text>

                <Text
                  className="mt-1 text-sm font-medium text-gray-900"
                  selectable
                >
                  {selectedLead?.email}
                </Text>


                <Text className="mt-4 text-xs font-semibold uppercase text-gray-500">
                  Phone
                </Text>

                <Text
                  className="mt-1 text-sm text-gray-900"
                  selectable
                >
                  {selectedLead?.phone ||
                    "N/A"}
                </Text>

              </View>


              {/* MESSAGE */}

              <View className="mt-5">

                <Text className="text-sm font-semibold text-gray-700">
                  Message
                </Text>

                <View className="mt-2 rounded-2xl bg-gray-50 p-4">

                  <Text className="text-sm leading-6 text-gray-600">
                    {selectedLead?.chat_summary ||
                      "No message available."}
                  </Text>

                </View>

              </View>


              {/* STATUS */}

              <View className="mt-5">

                <Text className="text-sm font-semibold text-gray-700">
                  Status
                </Text>

                <View className="mt-2 overflow-hidden rounded-xl border border-gray-200">

                  {STATUS_OPTIONS
                    .filter(
                      (option) =>
                        option.value !==
                        ""
                    )
                    .map(
                      (option) => {

                        const active =
                          editStatus ===
                          option.value;

                        return (

                          <Pressable
                            key={
                              option.value
                            }
                            onPress={() =>
                              setEditStatus(
                                option.value
                              )
                            }
                            className={`flex-row items-center justify-between border-b border-gray-100 px-4 py-4 ${
                              active
                                ? "bg-bronze/10"
                                : "bg-white"
                            }`}
                          >

                            <Text
                              className={`text-sm font-medium ${
                                active
                                  ? "text-bronze"
                                  : "text-gray-700"
                              }`}
                            >
                              {
                                option.label
                              }
                            </Text>

                            {active && (

                              <View className="h-5 w-5 items-center justify-center rounded-full bg-bronze">

                                <Text className="text-xs font-bold text-white">
                                  ✓
                                </Text>

                              </View>

                            )}

                          </Pressable>

                        );
                      }
                    )}

                </View>

              </View>

            </View>


            {/* =============================================
                FOOTER
            ============================================= */}

            <View className="border-t border-gray-100 px-5 pb-8 pt-4">

              {/* DELETE */}

              <Pressable
                onPress={
                  handleDelete
                }
                disabled={
                  deleting ||
                  saving
                }
                className="mb-3 flex-row items-center justify-center rounded-xl border border-red-200 bg-red-50 py-3"
              >

                {deleting ? (

                  <ActivityIndicator
                    size="small"
                    color="#dc2626"
                  />

                ) : (

                  <>

                    <Trash2
                      size={17}
                      color="#dc2626"
                    />

                    <Text className="ml-2 font-semibold text-red-600">
                      Delete Lead
                    </Text>

                  </>

                )}

              </Pressable>


              {/* ACTIONS */}

              <View className="flex-row gap-3">

                <Pressable
                  onPress={
                    closeModal
                  }
                  disabled={
                    saving ||
                    deleting
                  }
                  className="flex-1 rounded-xl border border-gray-300 py-3.5"
                >

                  <Text className="text-center font-semibold text-gray-700">
                    Cancel
                  </Text>

                </Pressable>


                <Pressable
                  onPress={
                    handleUpdate
                  }
                  disabled={
                    saving ||
                    deleting
                  }
                  className="flex-1 rounded-xl bg-bronze py-3.5"
                >

                  {saving ? (

                    <ActivityIndicator
                      size="small"
                      color="#ffffff"
                    />

                  ) : (

                    <Text className="text-center font-semibold text-white">
                      Save Changes
                    </Text>

                  )}

                </Pressable>

              </View>

            </View>

          </View>

        </View>

      </Modal>


      {/* =================================================
          FILTER MODAL
      ================================================= */}

      <Modal
        visible={
          showFilter
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowFilter(false)
        }
      >

        <View className="flex-1 justify-end bg-black/50">

          <View className="rounded-t-3xl bg-white">

            {/* =============================================
                HEADER
            ============================================= */}

            <View className="flex-row items-center justify-between border-b border-gray-100 px-5 py-4">

              <Text className="text-xl font-bold text-gray-900">
                Filters
              </Text>

              <Pressable
                onPress={() =>
                  setShowFilter(
                    false
                  )
                }
                className="h-9 w-9 items-center justify-center rounded-full bg-gray-100"
              >

                <X
                  size={19}
                  color="#374151"
                />

              </Pressable>

            </View>


            {/* =============================================
                FILTER CONTENT
            ============================================= */}

            <View className="px-5 py-5">

              {/* STATUS */}

              <Text className="text-sm font-semibold text-gray-700">
                Status
              </Text>

              <View className="mt-2 flex-row flex-wrap gap-2">

                {STATUS_OPTIONS.map(
                  (option) => {

                    const active =
                      tempFilters.status ===
                      option.value;

                    return (

                      <Pressable
                        key={
                          option.value ||
                          "all"
                        }
                        onPress={() =>
                          setTempFilters(
                            (
                              prev
                            ) => ({
                              ...prev,
                              status:
                                option.value,
                            })
                          )
                        }
                        className={`rounded-xl border px-4 py-2.5 ${
                          active
                            ? "border-bronze bg-bronze"
                            : "border-gray-200 bg-white"
                        }`}
                      >

                        <Text
                          className={`text-sm font-medium ${
                            active
                              ? "text-white"
                              : "text-gray-700"
                          }`}
                        >
                          {
                            option.label
                          }
                        </Text>

                      </Pressable>

                    );
                  }
                )}

              </View>


              {/* PHONE */}

              <Text className="mt-6 text-sm font-semibold text-gray-700">
                Phone Availability
              </Text>

              <View className="mt-2 flex-row gap-2">

                {[
                  {
                    value: "",
                    label: "All",
                  },
                  {
                    value: "yes",
                    label: "Has Phone",
                  },
                  {
                    value: "no",
                    label: "No Phone",
                  },
                ].map(
                  (option) => {

                    const active =
                      tempFilters.hasPhone ===
                      option.value;

                    return (

                      <Pressable
                        key={
                          option.value ||
                          "all"
                        }
                        onPress={() =>
                          setTempFilters(
                            (
                              prev
                            ) => ({
                              ...prev,
                              hasPhone:
                                option.value,
                            })
                          )
                        }
                        className={`rounded-xl border px-4 py-2.5 ${
                          active
                            ? "border-bronze bg-bronze"
                            : "border-gray-200 bg-white"
                        }`}
                      >

                        <Text
                          className={`text-sm font-medium ${
                            active
                              ? "text-white"
                              : "text-gray-700"
                          }`}
                        >
                          {
                            option.label
                          }
                        </Text>

                      </Pressable>

                    );
                  }
                )}

              </View>


              {/* SORT */}

              <Text className="mt-6 text-sm font-semibold text-gray-700">
                Sort By Date
              </Text>

              <View className="mt-2 overflow-hidden rounded-xl border border-gray-200">

                <Pressable
                  onPress={() =>
                    setTempFilters(
                      (prev) => ({
                        ...prev,
                        sort: "newest",
                      })
                    )
                  }
                  className={`flex-row items-center justify-between px-4 py-4 ${
                    tempFilters.sort ===
                    "newest"
                      ? "bg-bronze/10"
                      : "bg-white"
                  }`}
                >

                  <Text
                    className={`text-sm ${
                      tempFilters.sort ===
                      "newest"
                        ? "font-semibold text-bronze"
                        : "text-gray-700"
                    }`}
                  >
                    Newest First
                  </Text>

                  {tempFilters.sort ===
                    "newest" && (

                    <Text className="font-bold text-bronze">
                      ✓
                    </Text>

                  )}

                </Pressable>


                <Pressable
                  onPress={() =>
                    setTempFilters(
                      (prev) => ({
                        ...prev,
                        sort: "oldest",
                      })
                    )
                  }
                  className={`flex-row items-center justify-between border-t border-gray-100 px-4 py-4 ${
                    tempFilters.sort ===
                    "oldest"
                      ? "bg-bronze/10"
                      : "bg-white"
                  }`}
                >

                  <Text
                    className={`text-sm ${
                      tempFilters.sort ===
                      "oldest"
                        ? "font-semibold text-bronze"
                        : "text-gray-700"
                    }`}
                  >
                    Oldest First
                  </Text>

                  {tempFilters.sort ===
                    "oldest" && (

                    <Text className="font-bold text-bronze">
                      ✓
                    </Text>

                  )}

                </Pressable>

              </View>

            </View>


            {/* =============================================
                FOOTER
            ============================================= */}

            <View className="flex-row items-center justify-between border-t border-gray-100 px-5 pb-8 pt-4">

              <Pressable
                onPress={
                  resetFilters
                }
                className="px-2 py-3"
              >

                <Text className="font-medium text-gray-500">
                  Reset
                </Text>

              </Pressable>


              <Pressable
                onPress={
                  applyFilters
                }
                className="rounded-xl bg-bronze px-6 py-3"
              >

                <Text className="font-semibold text-white">
                  Apply Filters
                </Text>

              </Pressable>

            </View>

          </View>

        </View>

      </Modal>

    </View>
  );
}