import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import {
  FileText,
  Mail,
  MapPin,
  Phone,
  Search,
  Send,
  Trash2,
  Upload,
  X,
  Home,
  ChevronDown,
} from "lucide-react-native";

interface Valuation {
  _id: string;
  address: string;
  propertyType: string;
  bedrooms: string;
  upgrades: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

interface Attachment {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}

const API_URL = "https://realtorparth.ca";

const PAGE_SIZE = 10;
const MAX_FILES = 5;

export default function HomeValuationsScreen() {
  // =====================================================
  // DATA
  // =====================================================

  const [data, setData] = useState<Valuation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =====================================================
  // SEARCH
  // =====================================================

  const [search, setSearch] = useState("");

  // =====================================================
  // PAGINATION
  // =====================================================

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // =====================================================
  // EMAIL MODAL
  // =====================================================

  const [selected, setSelected] = useState<Valuation | null>(null);
  const [showModal, setShowModal] = useState(false);

  // =====================================================
  // EMAIL FORM
  // =====================================================

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // =====================================================
  // ATTACHMENTS
  // =====================================================

  const [files, setFiles] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);

  // =====================================================
  // DELETE
  // =====================================================

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // =====================================================
  // FETCH VALUATIONS
  // =====================================================

  const fetchValuations = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(
        `${API_URL}/api/homevaluation`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch valuations");
      }

      const result = await response.json();

      const valuations: Valuation[] = Array.isArray(result)
        ? result
        : result.data || result.valuations || [];

      setData(valuations);
      setVisibleCount(PAGE_SIZE);
    } catch (error) {
      console.error("Fetch valuations error:", error);

      Alert.alert(
        "Error",
        "Failed to load home valuation requests. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchValuations();
  }, []);

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return data;
    }

    return data.filter((item) => {
      const combined = [
        item.name,
        item.email,
        item.address,
        item.phone,
        item.propertyType,
        item.bedrooms,
        item.upgrades,
        new Date(item.createdAt).toLocaleString(),
        item.createdAt,
      ]
        .join(" ")
        .toLowerCase();

      return combined.includes(q);
    });
  }, [data, search]);

  // =====================================================
  // VISIBLE DATA
  // =====================================================

  const visibleData = filteredData.slice(0, visibleCount);

  const hasMore = visibleCount < filteredData.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) =>
      Math.min(
        prev + PAGE_SIZE,
        filteredData.length
      )
    );
  };

  // =====================================================
  // OPEN EMAIL RESPONSE MODAL
  // =====================================================

  const openModal = (item: Valuation) => {
    setSelected(item);

    setSubject(
      `Your Home Valuation Report - ${item.email}`
    );

    setMessage(
      `Hi ${item.name},

Here is your home valuation report.

`
    );

    setFiles([]);
    setShowModal(true);
  };

  // =====================================================
  // CLOSE EMAIL MODAL
  // =====================================================

  const closeModal = () => {
    if (uploading) {
      return;
    }

    setShowModal(false);
    setSelected(null);
    setSubject("");
    setMessage("");
    setFiles([]);
  };

  // =====================================================
  // PICK ATTACHMENTS
  // =====================================================

  const handlePickFiles = async () => {
    if (files.length >= MAX_FILES) {
      Alert.alert(
        "Maximum Files",
        `You can attach a maximum of ${MAX_FILES} files.`
      );
      return;
    }

    try {
      const result =
        await DocumentPicker.getDocumentAsync({
          multiple: true,
          copyToCacheDirectory: true,
          type: "*/*",
        });

      if (result.canceled) {
        return;
      }

      const pickedFiles: Attachment[] =
        result.assets.map((file) => ({
          uri: file.uri,
          name:
            file.name ||
            `attachment-${Date.now()}`,
          mimeType:
            file.mimeType ||
            "application/octet-stream",
          size: file.size,
        }));

      setFiles((prev) => {
        const combined = [...prev, ...pickedFiles];

        // Remove duplicates
        const unique = combined.filter(
          (file, index, self) =>
            index ===
            self.findIndex(
              (existingFile) =>
                existingFile.name === file.name &&
                existingFile.size === file.size
            )
        );

        if (unique.length > MAX_FILES) {
          Alert.alert(
            "Maximum Files",
            `You can attach a maximum of ${MAX_FILES} files.`
          );

          return unique.slice(0, MAX_FILES);
        }

        return unique;
      });
    } catch (error) {
      console.error(
        "File picker error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to select files."
      );
    }
  };

  // =====================================================
  // REMOVE FILE
  // =====================================================

  const removeFile = (index: number) => {
    setFiles((prev) =>
      prev.filter(
        (_, fileIndex) =>
          fileIndex !== index
      )
    );
  };

  // =====================================================
  // CLEAR ALL FILES
  // =====================================================

  const clearAllFiles = () => {
    setFiles([]);
  };

  // =====================================================
  // FORMAT FILE SIZE
  // =====================================================

  const formatFileSize = (
    size?: number
  ) => {
    if (!size) {
      return "Unknown size";
    }

    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(
        size / 1024
      ).toFixed(1)} KB`;
    }

    return `${(
      size /
      1024 /
      1024
    ).toFixed(2)} MB`;
  };

  // =====================================================
  // SEND EMAIL
  // =====================================================

  const handleSendMail = async () => {
    if (!selected) {
      return;
    }

    // Validate subject
    if (!subject.trim()) {
      Alert.alert(
        "Missing Subject",
        "Please enter an email subject."
      );
      return;
    }

    // Validate message
    if (!message.trim()) {
      Alert.alert(
        "Missing Message",
        "Please enter an email message."
      );
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      // Recipient
      formData.append(
        "to",
        selected.email
      );

      // Subject
      formData.append(
        "subject",
        subject.trim()
      );

      // Message
      formData.append(
        "message",
        message.trim()
      );

      // Attachments
      files.forEach((file) => {
        formData.append(
          "files",
          {
            uri: file.uri,
            name: file.name,
            type: file.mimeType,
          } as any
        );
      });

      const response = await fetch(
        `${API_URL}/api/homevaluation/send-mail`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        let errorMessage =
          "Failed to send email.";

        try {
          const errorResult =
            await response.json();

          if (
            errorResult?.message
          ) {
            errorMessage =
              errorResult.message;
          }
        } catch {
          // Ignore JSON parsing error
        }

        throw new Error(
          errorMessage
        );
      }

      Alert.alert(
        "Email Sent",
        `Your valuation report has been sent successfully to ${selected.email}.`,
        [
          {
            text: "OK",
            onPress: closeModal,
          },
        ]
      );
    } catch (error) {
      console.error(
        "Send email error:",
        error
      );

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to send email. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = (
    id: string
  ) => {
    Alert.alert(
      "Delete Valuation",
      "Are you sure you want to delete this valuation request?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingId(id);

              const response =
                await fetch(
                  `${API_URL}/api/homevaluation/${id}`,
                  {
                    method: "DELETE",
                  }
                );

              if (!response.ok) {
                throw new Error(
                  "Delete failed"
                );
              }

              setData((prev) =>
                prev.filter(
                  (item) =>
                    item._id !== id
                )
              );

              Alert.alert(
                "Deleted",
                "Valuation request deleted successfully."
              );
            } catch (error) {
              console.error(
                "Delete error:",
                error
              );

              Alert.alert(
                "Error",
                "Failed to delete valuation."
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  // =====================================================
  // CALL
  // =====================================================

  const handleCall = async (
    phone: string
  ) => {
    if (!phone) {
      return;
    }

    try {
      await Linking.openURL(
        `tel:${phone}`
      );
    } catch {
      Alert.alert(
        "Unable to Call",
        "Could not open the phone application."
      );
    }
  };

  // =====================================================
  // EMAIL
  // =====================================================

  const handleEmail = async (
    email: string
  ) => {
    if (!email) {
      return;
    }

    try {
      await Linking.openURL(
        `mailto:${email}`
      );
    } catch {
      Alert.alert(
        "Unable to Email",
        "Could not open the email application."
      );
    }
  };

  // =====================================================
  // DATE
  // =====================================================

  const formatDate = (
    date: string
  ) => {
    try {
      return new Date(
        date
      ).toLocaleString();
    } catch {
      return date;
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#FAFAF8]">
        <ActivityIndicator
          size="large"
          color="#B8860B"
        />

        <Text className="mt-4 text-gray-500">
          Loading valuation requests...
        </Text>
      </View>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <View className="flex-1 bg-[#FAFAF8]">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-5 pb-10"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              fetchValuations(true)
            }
            tintColor="#B8860B"
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* =====================================================
            HEADER
        ===================================================== */}

        <View className="mb-6">
          

          <Text className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
            Home Valuation Requests
          </Text>

          <Text className="mt-2 text-sm leading-5 text-gray-500">
            Manage homeowner valuation
            requests and send professional
            responses.
          </Text>
        </View>

        {/* =====================================================
            SEARCH
        ===================================================== */}

        <View className="mb-5 rounded-2xl border border-[#E8E2D6] bg-white p-3 shadow-sm">
          <View className="flex-row items-center">
            <Search
              size={20}
              color="#9CA3AF"
            />

            <TextInput
              value={search}
              onChangeText={(value) => {
                setSearch(value);
                setVisibleCount(
                  PAGE_SIZE
                );
              }}
              placeholder="Search address, client, email..."
              placeholderTextColor="#9CA3AF"
              className="ml-3 flex-1 py-1 text-base text-gray-900"
            />

            {search.length > 0 && (
              <Pressable
                onPress={() => {
                  setSearch("");
                  setVisibleCount(
                    PAGE_SIZE
                  );
                }}
                className="ml-2 h-8 w-8 items-center justify-center rounded-full bg-gray-100"
              >
                <X
                  size={16}
                  color="#6B7280"
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* =====================================================
            RESULT COUNT
        ===================================================== */}

        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-gray-700">
            {filteredData.length} Request
            {filteredData.length !== 1
              ? "s"
              : ""}
          </Text>

          <Text className="text-xs text-gray-400">
            Showing{" "}
            {Math.min(
              visibleCount,
              filteredData.length
            )}{" "}
            of{" "}
            {filteredData.length}
          </Text>
        </View>

        {/* =====================================================
            EMPTY
        ===================================================== */}

        {filteredData.length === 0 ? (
          <View className="items-center rounded-2xl border border-[#E8E2D6] bg-white px-5 py-16">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-[#B8860B]/10">
              <Search
                size={28}
                color="#B8860B"
              />
            </View>

            <Text className="mt-5 text-lg font-semibold text-gray-900">
              No valuation requests
              found
            </Text>

            <Text className="mt-2 text-center text-sm leading-5 text-gray-500">
              Try changing your search or
              pull down to refresh.
            </Text>
          </View>
        ) : (
          <>
            {/* =====================================================
                CARDS
            ===================================================== */}

            <View className="gap-5">
              {visibleData.map(
                (item) => (
                  <View
                    key={item._id}
                    className="overflow-hidden rounded-2xl border border-[#E8E2D6] bg-white shadow-sm"
                  >
                    {/* CARD HEADER */}

                    <View className="border-b border-[#F3EEE6] p-5">
                      <View className="flex-row items-start">
                        <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#B8860B]/10">
                          <MapPin
                            size={21}
                            color="#B8860B"
                          />
                        </View>

                        <View className="ml-3 flex-1">
                          <Text
                            numberOfLines={
                              2
                            }
                            className="text-base font-semibold leading-6 text-gray-900"
                          >
                            {
                              item.address
                            }
                          </Text>

                          <Text className="mt-2 text-xs text-gray-400">
                            {formatDate(
                              item.createdAt
                            )}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* CARD BODY */}

                    <View className="p-5">
                      {/* PROPERTY INFO */}

                      <View className="flex-row flex-wrap items-center gap-2">
                        <View className="rounded-full bg-[#B8860B]/10 px-3 py-1">
                          <Text className="text-xs font-medium text-[#B8860B]">
                            {item.propertyType ||
                              "Property"}
                          </Text>
                        </View>

                        <View className="flex-row items-center rounded-full bg-gray-100 px-3 py-1">
                          <Home
                            size={14}
                            color="#6B7280"
                          />

                          <Text className="ml-1 text-xs text-gray-600">
                            {item.bedrooms ||
                              "N/A"}{" "}
                            Beds
                          </Text>
                        </View>
                      </View>

                      {/* UPGRADES */}

                      {item.upgrades ? (
                        <View className="mt-5 rounded-xl border border-[#EEE7D8] bg-[#FCFBF8] p-4">
                          <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-[#B8860B]">
                            Property Upgrades
                          </Text>

                          <Text
                            numberOfLines={
                              4
                            }
                            className="text-sm leading-6 text-gray-600"
                          >
                            {
                              item.upgrades
                            }
                          </Text>
                        </View>
                      ) : null}

                      {/* CONTACT */}

                      <View className="mt-5 rounded-xl border border-[#F1ECE4] bg-[#FAFAF8] p-4">
                        <View className="flex-row items-center">
                          <View className="h-11 w-11 items-center justify-center rounded-full bg-[#B8860B]/10">
                            <Text className="text-base font-bold text-[#B8860B]">
                              {item.name
                                ?.charAt(
                                  0
                                )
                                ?.toUpperCase() ||
                                "?"}
                            </Text>
                          </View>

                          <View className="ml-3 flex-1">
                            <Text className="text-[15px] font-semibold text-gray-900">
                              {
                                item.name
                              }
                            </Text>

                            <Text className="mt-0.5 text-xs text-gray-500">
                              Property
                              Owner
                            </Text>
                          </View>
                        </View>

                        {/* EMAIL */}

                        <Pressable
                          onPress={() =>
                            handleEmail(
                              item.email
                            )
                          }
                          className="mt-4 flex-row items-center rounded-xl p-2 active:bg-white"
                        >
                          <View className="h-9 w-9 items-center justify-center rounded-lg bg-[#B8860B]/10">
                            <Mail
                              size={
                                16
                              }
                              color="#B8860B"
                            />
                          </View>

                          <Text
                            numberOfLines={
                              1
                            }
                            className="ml-3 flex-1 text-sm text-gray-600"
                          >
                            {
                              item.email
                            }
                          </Text>
                        </Pressable>

                        {/* PHONE */}

                        {item.phone ? (
                          <Pressable
                            onPress={() =>
                              handleCall(
                                item.phone
                              )
                            }
                            className="mt-2 flex-row items-center rounded-xl p-2 active:bg-white"
                          >
                            <View className="h-9 w-9 items-center justify-center rounded-lg bg-[#B8860B]/10">
                              <Phone
                                size={
                                  16
                                }
                                color="#B8860B"
                              />
                            </View>

                            <Text className="ml-3 flex-1 text-sm text-gray-600">
                              {
                                item.phone
                              }
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>

                      {/* ACTIONS */}

                      <View className="mt-5 flex-row gap-3">
                        <Pressable
                          onPress={() =>
                            openModal(
                              item
                            )
                          }
                          className="flex-1 flex-row items-center justify-center rounded-xl bg-[#B8860B] py-3 active:opacity-80"
                        >
                          <Send
                            size={
                              17
                            }
                            color="#FFFFFF"
                          />

                          <Text className="ml-2 text-sm font-semibold text-white">
                            Respond
                          </Text>
                        </Pressable>

                        <Pressable
                          disabled={
                            deletingId ===
                            item._id
                          }
                          onPress={() =>
                            handleDelete(
                              item._id
                            )
                          }
                          className="flex-row items-center justify-center rounded-xl border border-red-200 bg-white px-4 py-3 active:bg-red-50"
                        >
                          {deletingId ===
                            item._id ? (
                            <ActivityIndicator
                              size="small"
                              color="#DC2626"
                            />
                          ) : (
                            <>
                              <Trash2
                                size={
                                  17
                                }
                                color="#DC2626"
                              />

                              <Text className="ml-2 text-sm font-medium text-red-600">
                                Delete
                              </Text>
                            </>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  </View>
                )
              )}
            </View>

            {/* =====================================================
                LOAD MORE
            ===================================================== */}

            {hasMore && (
              <Pressable
                onPress={
                  handleLoadMore
                }
                className="mt-6 flex-row items-center justify-center rounded-xl border border-[#B8860B] bg-white py-3.5 active:bg-[#FFF9EA]"
              >
                <Text className="text-sm font-semibold text-[#B8860B]">
                  Load More
                </Text>

                <ChevronDown
                  size={18}
                  color="#B8860B"
                  style={{
                    marginLeft: 6,
                  }}
                />
              </Pressable>
            )}

            {/* ALL LOADED */}

            {!hasMore &&
              filteredData.length >
              PAGE_SIZE && (
                <View className="mt-5 items-center">
                  <Text className="text-xs text-gray-400">
                    All valuation
                    requests loaded
                  </Text>
                </View>
              )}
          </>
        )}
      </ScrollView>

      {/* =========================================================
          EMAIL RESPONSE MODAL
      ========================================================= */}

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View className="flex-1 bg-black/50">

          {/* BOTTOM SHEET */}
          <View className="mt-auto h-[94%] overflow-hidden rounded-t-[30px] bg-white">

            {/* =====================================================
          HEADER
      ===================================================== */}
            <View className="border-b border-[#EEE7D8] bg-[#FCFBF8] px-5 py-5">

              <View className="flex-row items-start justify-between">

                <View className="flex-1 pr-4">

                  <View className="self-start rounded-full bg-[#B8860B]/10 px-3 py-1">
                    <Text className="text-xs font-bold uppercase tracking-wider text-[#B8860B]">
                      Email Response
                    </Text>
                  </View>

                  <Text className="mt-3 text-2xl font-bold text-gray-900">
                    Send Home Valuation
                  </Text>

                  <Text className="mt-1 text-sm leading-5 text-gray-500">
                    Send a professional valuation report with attachments.
                  </Text>

                </View>

                <Pressable
                  disabled={uploading}
                  onPress={closeModal}
                  className="h-10 w-10 items-center justify-center rounded-xl border border-[#E8E2D6] bg-white"
                >
                  <X
                    size={20}
                    color="#6B7280"
                  />
                </Pressable>

              </View>
            </View>

            {/* =====================================================
          FORM SCROLL AREA
      ===================================================== */}
            <ScrollView
              className="flex-1"
              contentContainerStyle={{
                padding: 20,
                paddingBottom: 30,
              }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={true}
            >

              {selected && (
                <View>

                  {/* =================================================
                RECIPIENT CARD
            ================================================= */}
                  <View className="rounded-2xl border border-[#E8E2D6] bg-[#FAFAF8] p-4">

                    {/* USER */}
                    <View className="flex-row items-center">

                      <View className="h-12 w-12 items-center justify-center rounded-full bg-[#B8860B]/10">
                        <Text className="text-lg font-bold text-[#B8860B]">
                          {selected.name
                            ?.charAt(0)
                            ?.toUpperCase() || "?"}
                        </Text>
                      </View>

                      <View className="ml-3 flex-1">

                        <Text className="text-lg font-semibold text-gray-900">
                          {selected.name}
                        </Text>

                        <Text className="mt-0.5 text-sm text-gray-500">
                          Property Owner
                        </Text>

                      </View>

                    </View>

                    {/* RECIPIENT */}
                    <View className="mt-5">

                      <Text className="mb-2 text-sm font-medium text-gray-700">
                        Recipient
                      </Text>

                      <View className="flex-row items-center rounded-xl border border-[#E8E2D6] bg-white px-4 py-3">

                        <Mail
                          size={16}
                          color="#B8860B"
                        />

                        <Text
                          numberOfLines={1}
                          className="ml-3 flex-1 text-sm text-gray-600"
                        >
                          {selected.email}
                        </Text>

                      </View>

                    </View>

                    {/* PROPERTY */}
                    <View className="mt-4">

                      <Text className="mb-2 text-sm font-medium text-gray-700">
                        Property
                      </Text>

                      <View className="flex-row items-center rounded-xl border border-[#E8E2D6] bg-white px-4 py-3">

                        <MapPin
                          size={16}
                          color="#B8860B"
                        />

                        <Text
                          numberOfLines={2}
                          className="ml-3 flex-1 text-sm leading-5 text-gray-600"
                        >
                          {selected.address}
                        </Text>

                      </View>

                    </View>

                  </View>

                  {/* =================================================
                EMAIL SUBJECT
            ================================================= */}
                  <View className="mt-5">

                    <Text className="mb-2 text-sm font-semibold text-gray-700">
                      Email Subject
                    </Text>

                    <TextInput
                      value={subject}
                      onChangeText={setSubject}
                      placeholder="Enter email subject..."
                      placeholderTextColor="#9CA3AF"
                      editable={!uploading}
                      autoCapitalize="sentences"
                      returnKeyType="next"
                      className="rounded-xl border border-[#E8E2D6] bg-white px-4 py-3.5 text-base text-gray-900"
                    />

                  </View>

                  {/* =================================================
                EMAIL MESSAGE
            ================================================= */}
                  <View className="mt-5">

                    <Text className="mb-2 text-sm font-semibold text-gray-700">
                      Email Message
                    </Text>

                    <TextInput
                      value={message}
                      onChangeText={setMessage}
                      placeholder="Write your email..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                      editable={!uploading}
                      textAlignVertical="top"
                      autoCapitalize="sentences"
                      className="min-h-[190px] rounded-xl border border-[#E8E2D6] bg-white px-4 py-3.5 text-base leading-6 text-gray-900"
                    />

                    <Text className="mt-2 text-xs text-gray-400">
                      This message will be sent to {selected.email}
                    </Text>

                  </View>

                  {/* =================================================
                ATTACHMENTS
            ================================================= */}
                  <View className="mt-6">

                    {/* ATTACHMENT HEADER */}
                    <View className="mb-3 flex-row items-center justify-between">

                      <View>

                        <Text className="text-sm font-semibold text-gray-700">
                          Attachments
                        </Text>

                        <Text className="mt-1 text-xs text-gray-400">
                          {files.length} / {MAX_FILES} files selected
                        </Text>

                      </View>

                      {files.length > 0 && (
                        <Pressable
                          disabled={uploading}
                          onPress={clearAllFiles}
                          className="rounded-lg border border-red-200 bg-white px-3 py-2 active:bg-red-50"
                        >
                          <Text className="text-xs font-semibold text-red-600">
                            Clear All
                          </Text>
                        </Pressable>
                      )}

                    </View>

                    {/* =================================================
                  UPLOAD BUTTON
              ================================================= */}
                    <Pressable
                      disabled={
                        uploading ||
                        files.length >= MAX_FILES
                      }
                      onPress={handlePickFiles}
                      className={`items-center rounded-2xl border-2 border-dashed px-5 py-8 ${files.length >= MAX_FILES
                          ? "border-gray-200 bg-gray-100"
                          : "border-[#E8E2D6] bg-[#FCFBF8] active:border-[#B8860B] active:bg-[#FFFDF8]"
                        }`}
                    >

                      <View
                        className={`h-16 w-16 items-center justify-center rounded-2xl ${files.length >= MAX_FILES
                            ? "bg-gray-200"
                            : "bg-[#B8860B]/10"
                          }`}
                      >
                        <Upload
                          size={30}
                          color={
                            files.length >= MAX_FILES
                              ? "#9CA3AF"
                              : "#B8860B"
                          }
                        />
                      </View>

                      <Text className="mt-4 text-base font-bold text-gray-900">
                        {files.length >= MAX_FILES
                          ? "Maximum Files Selected"
                          : "Upload Attachments"}
                      </Text>

                      <Text className="mt-2 text-center text-sm leading-5 text-gray-500">
                        {files.length >= MAX_FILES
                          ? "Remove a file to select another."
                          : "Tap here to select files from your device."}
                      </Text>

                      {files.length < MAX_FILES && (
                        <View className="mt-4 rounded-lg bg-[#B8860B]/10 px-3 py-2">
                          <Text className="text-xs font-semibold text-[#B8860B]">
                            Select files
                          </Text>
                        </View>
                      )}

                    </Pressable>

                    {/* =================================================
                  SELECTED FILES
              ================================================= */}
                    {files.length > 0 && (
                      <View className="mt-4 rounded-2xl border border-[#E8E2D6] bg-white p-4">

                        <View className="mb-4">

                          <Text className="text-sm font-semibold text-gray-900">
                            Selected Attachments
                          </Text>

                          <Text className="mt-1 text-xs text-gray-500">
                            {files.length} file
                            {files.length > 1 ? "s" : ""} ready to send
                          </Text>

                        </View>

                        <View className="gap-3">

                          {files.map((file, index) => (
                            <View
                              key={`${file.name}-${index}`}
                              className="flex-row items-center rounded-xl border border-[#F0ECE4] bg-[#FCFBF8] p-3"
                            >

                              {/* FILE ICON */}
                              <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#B8860B]/10">
                                <FileText
                                  size={20}
                                  color="#B8860B"
                                />
                              </View>

                              {/* FILE INFO */}
                              <View className="ml-3 flex-1">

                                <Text
                                  numberOfLines={1}
                                  className="text-sm font-semibold text-gray-800"
                                >
                                  {file.name}
                                </Text>

                                <Text className="mt-1 text-xs text-gray-500">
                                  {formatFileSize(file.size)}
                                </Text>

                              </View>

                              {/* REMOVE */}
                              <Pressable
                                disabled={uploading}
                                onPress={() => removeFile(index)}
                                className="ml-2 h-9 w-9 items-center justify-center rounded-lg active:bg-red-50"
                              >
                                <X
                                  size={18}
                                  color="#DC2626"
                                />
                              </Pressable>

                            </View>
                          ))}

                        </View>

                      </View>
                    )}

                  </View>

                  {/* =================================================
                BOTTOM SPACE
            ================================================= */}
                  <View className="h-5" />

                </View>
              )}

            </ScrollView>

            {/* =====================================================
          FIXED FOOTER
      ===================================================== */}
            <View className="border-t border-[#EEE7D8] bg-[#FCFBF8] px-5 py-4">

              <View className="flex-row gap-3">

                {/* CANCEL */}
                <Pressable
                  disabled={uploading}
                  onPress={closeModal}
                  className="flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white py-3.5 active:bg-gray-50"
                >
                  <Text className="text-sm font-semibold text-gray-700">
                    Cancel
                  </Text>
                </Pressable>

                {/* SEND EMAIL */}
                <Pressable
                  disabled={uploading}
                  onPress={handleSendMail}
                  className={`flex-[1.4] flex-row items-center justify-center rounded-xl py-3.5 ${uploading
                      ? "bg-[#B8860B]/60"
                      : "bg-[#B8860B] active:opacity-80"
                    }`}
                >

                  {uploading ? (
                    <>
                      <ActivityIndicator
                        size="small"
                        color="#FFFFFF"
                      />

                      <Text className="ml-2 text-sm font-semibold text-white">
                        Sending...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Send
                        size={17}
                        color="#FFFFFF"
                      />

                      <Text className="ml-2 text-sm font-semibold text-white">
                        Send Email
                      </Text>
                    </>
                  )}

                </Pressable>

              </View>

            </View>

          </View>
        </View>
      </Modal>
    </View>
  );
}
