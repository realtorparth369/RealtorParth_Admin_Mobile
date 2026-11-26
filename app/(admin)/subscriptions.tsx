import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import {
  CheckCircle,
  FileText,
  Mail,
  Send,
  Users,
  X,
} from "lucide-react-native";

interface Subscriber {
  _id: string;
  email: string;
  createdAt: string;
  status?: "Active" | "Unsubscribed";
}

interface Attachment {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

const API_URL = "https://realtorparth.ca/api/subscribe";

const MAX_FILES = 10;

export default function SubscriptionsScreen() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);

  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const [showAllModal, setShowAllModal] = useState(false);

  /* ============================================================
     FETCH SUBSCRIBERS
  ============================================================ */

  useEffect(() => {
    void fetchSubscribers();
  }, []);

  const fetchSubscribers = async (): Promise<void> => {
    try {
      setLoadingSubs(true);

      const response = await fetch(API_URL);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to load subscribers."
        );
      }

      setSubscribers(data.data || []);
    } catch (error) {
      console.error("Error fetching subscribers:", error);

      Alert.alert(
        "Error",
        "Failed to load subscribers."
      );
    } finally {
      setLoadingSubs(false);
    }
  };

  /* ============================================================
     COUNTS
  ============================================================ */

  const activeCount = useMemo(
    () =>
      subscribers.filter(
        (subscriber) =>
          subscriber.status !== "Unsubscribed"
      ).length,
    [subscribers]
  );

  const unsubscribedCount = useMemo(
    () =>
      subscribers.filter(
        (subscriber) =>
          subscriber.status === "Unsubscribed"
      ).length,
    [subscribers]
  );

  const totalCount = subscribers.length;

  /* ============================================================
     FILE PICKER
  ============================================================ */

  const handlePickFiles = async (): Promise<void> => {
    try {
      if (attachments.length >= MAX_FILES) {
        Alert.alert(
          "Maximum Files",
          `You can attach up to ${MAX_FILES} files.`
        );
        return;
      }

      const result =
        await DocumentPicker.getDocumentAsync({
          type: "*/*",
          multiple: true,
          copyToCacheDirectory: true,
        });

      if (result.canceled) {
        return;
      }

      const selectedFiles: Attachment[] =
        result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          size: asset.size,
          mimeType: asset.mimeType,
        }));

      const remainingSlots =
        MAX_FILES - attachments.length;

      const filesToAdd =
        selectedFiles.slice(0, remainingSlots);

      setAttachments((previous) => [
        ...previous,
        ...filesToAdd,
      ]);

      if (
        selectedFiles.length > remainingSlots
      ) {
        Alert.alert(
          "File Limit",
          `Only ${remainingSlots} more file${remainingSlots === 1 ? "" : "s"
          } could be added.`
        );
      }
    } catch (error) {
      console.error("File picker error:", error);

      Alert.alert(
        "Error",
        "Unable to select files."
      );
    }
  };

  /* ============================================================
     REMOVE ATTACHMENT
  ============================================================ */

  const removeAttachment = (
    index: number
  ): void => {
    if (sending) return;

    setAttachments((previous) =>
      previous.filter(
        (_, fileIndex) =>
          fileIndex !== index
      )
    );
  };

  /* ============================================================
     CLEAR ATTACHMENTS
  ============================================================ */

  const clearAttachments = (): void => {
    if (sending) return;

    setAttachments([]);
  };

  /* ============================================================
     FILE SIZE
  ============================================================ */

  const formatFileSize = (
    size?: number
  ): string => {
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

  /* ============================================================
     SEND NEWSLETTER
  ============================================================ */

  const handleSend = async (): Promise<void> => {
    if (!subject.trim()) {
      Alert.alert(
        "Missing Subject",
        "Please enter a subject."
      );
      return;
    }

    if (!content.trim()) {
      Alert.alert(
        "Missing Content",
        "Please enter the newsletter content."
      );
      return;
    }

    if (activeCount === 0) {
      Alert.alert(
        "No Active Subscribers",
        "There are no active subscribers."
      );
      return;
    }

    try {
      setSending(true);

      const formData = new FormData();

      formData.append(
        "subject",
        subject.trim()
      );

      formData.append(
        "content",
        content.trim()
      );

      attachments.forEach((file) => {
        formData.append(
          "attachments",
          {
            uri: file.uri,
            name: file.name,
            type:
              file.mimeType ||
              "application/octet-stream",
          } as any
        );
      });

      const response = await fetch(
        `${API_URL}/send-newsletter`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
          "Failed to send newsletter."
        );
      }

      setSent(true);

      setSubject("");
      setContent("");
      setAttachments([]);

      setTimeout(() => {
        setSent(false);
      }, 3000);
    } catch (error: any) {
      console.error(
        "Newsletter Error:",
        error
      );

      Alert.alert(
        "Send Failed",
        error?.message ||
        "Something went wrong while sending the newsletter."
      );
    } finally {
      setSending(false);
    }
  };

  /* ============================================================
     STAT CARD
  ============================================================ */

  const StatCard = ({
    icon,
    label,
    value,
    iconBg,
    iconColor,
  }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    iconBg: string;
    iconColor: string;
  }) => (
    <View className="flex-1 rounded-2xl border border-[#E8E2D6] bg-white p-4">
      <View
        className={`h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}
      >
        {icon}
      </View>

      <Text className="mt-3 text-xs font-bold uppercase tracking-wider text-gray-400">
        {label}
      </Text>

      <Text className="mt-1 text-2xl font-bold text-gray-900">
        {value}
      </Text>
    </View>
  );

  /* ============================================================
     NEWSLETTER FORM
  ============================================================ */

  return (
    <>
      <ScrollView
        className="flex-1 bg-[#F5F4F1]"
        contentContainerClassName="p-5 pb-10"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================
            HEADER
        ======================================================== */}

        <View>
          <Text className="text-2xl font-bold text-gray-900">
            Newsletter Management
          </Text>

          <Text className="mt-1 text-sm leading-5 text-gray-500">
            Manage subscribers and send newsletter
            emails.
          </Text>
        </View>

        {/* ========================================================
            STATS
        ======================================================== */}

        <View className="mt-5 flex-row gap-3">
          <StatCard
            label="Active"
            value={activeCount}
            icon={
              <Users
                size={20}
                color="#16A34A"
              />
            }
            iconBg="bg-green-50"
            iconColor="#16A34A"
          />

          <StatCard
            label="Unsubscribed"
            value={unsubscribedCount}
            icon={
              <Users
                size={20}
                color="#6B7280"
              />
            }
            iconBg="bg-gray-100"
            iconColor="#6B7280"
          />

          <StatCard
            label="Total"
            value={totalCount}
            icon={
              <Users
                size={20}
                color="#B8860B"
              />
            }
            iconBg="bg-[#B8860B]/10"
            iconColor="#B8860B"
          />
        </View>

        {/* ========================================================
            DRAFT NEWSLETTER
        ======================================================== */}

        <View className="mt-5 overflow-hidden rounded-2xl border border-[#E8E2D6] bg-white">
          {/* HEADER */}

          <View className="border-b border-[#EEE7D8] bg-[#FCFBF8] px-5 py-4">
            <View className="flex-row items-center">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#B8860B]/10">
                <Mail
                  size={20}
                  color="#B8860B"
                />
              </View>

              <View className="ml-3">
                <Text className="text-lg font-bold text-gray-900">
                  Draft Newsletter
                </Text>

                <Text className="mt-0.5 text-xs text-gray-500">
                  Send an email to your active subscribers
                </Text>
              </View>
            </View>
          </View>

          {/* SUCCESS */}

          {sent ? (
            <View className="p-6">
              <View className="items-center rounded-2xl bg-green-50 px-5 py-8">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle
                    size={34}
                    color="#16A34A"
                  />
                </View>

                <Text className="mt-4 text-center text-xl font-bold text-green-800">
                  Newsletter Sent Successfully!
                </Text>

                <Text className="mt-2 text-center text-sm leading-5 text-green-700">
                  Your email was sent to{" "}
                  {activeCount} active subscribers.
                </Text>
              </View>
            </View>
          ) : (
            <View className="p-5">
              {/* SUBJECT */}

              <View>
                <Text className="mb-2 text-sm font-semibold text-gray-700">
                  Subject Line
                </Text>

                <TextInput
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="Enter newsletter subject..."
                  placeholderTextColor="#9CA3AF"
                  editable={!sending}
                  className="rounded-xl border border-[#E8E2D6] bg-white px-4 py-3.5 text-sm text-gray-900"
                />
              </View>

              {/* CONTENT */}

              <View className="mt-5">
                <Text className="mb-2 text-sm font-semibold text-gray-700">
                  Message Content
                </Text>

                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="Write your newsletter message..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  editable={!sending}
                  textAlignVertical="top"
                  className="min-h-[190px] rounded-xl border border-[#E8E2D6] bg-white px-4 py-3.5 text-sm leading-6 text-gray-900"
                />
              </View>

              {/* ==================================================
                  ATTACHMENTS
              ================================================== */}

              <View className="mt-5">
                <View className="mb-3 flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm font-semibold text-gray-700">
                      Attachments
                    </Text>

                    <Text className="mt-1 text-xs text-gray-400">
                      {attachments.length} /{" "}
                      {MAX_FILES} files
                    </Text>
                  </View>

                  {attachments.length > 0 && (
                    <Pressable
                      disabled={sending}
                      onPress={
                        clearAttachments
                      }
                      className="rounded-lg border border-red-200 px-3 py-2"
                    >
                      <Text className="text-xs font-medium text-red-600">
                        Clear All
                      </Text>
                    </Pressable>
                  )}
                </View>

                {/* UPLOAD */}

                <Pressable
                  disabled={
                    sending ||
                    attachments.length >=
                    MAX_FILES
                  }
                  onPress={handlePickFiles}
                  className={`items-center rounded-2xl border-2 border-dashed px-5 py-7 ${attachments.length >=
                    MAX_FILES
                    ? "border-gray-200 bg-gray-100"
                    : "border-[#E8E2D6] bg-[#FCFBF8] active:border-[#B8860B]"
                    }`}
                >
                  <View
                    className={`h-14 w-14 items-center justify-center rounded-2xl ${attachments.length >=
                      MAX_FILES
                      ? "bg-gray-200"
                      : "bg-[#B8860B]/10"
                      }`}
                  >
                    <FileText
                      size={27}
                      color={
                        attachments.length >=
                          MAX_FILES
                          ? "#9CA3AF"
                          : "#B8860B"
                      }
                    />
                  </View>

                  <Text className="mt-4 text-base font-semibold text-gray-900">
                    {attachments.length >=
                      MAX_FILES
                      ? "Maximum Files Selected"
                      : "Attach Files"}
                  </Text>

                  <Text className="mt-1 text-center text-sm leading-5 text-gray-500">
                    {attachments.length >=
                      MAX_FILES
                      ? "Remove a file to select another."
                      : "Tap here to select files from your device."}
                  </Text>
                </Pressable>

                {/* SELECTED FILES */}

                {attachments.length > 0 && (
                  <View className="mt-4 rounded-2xl border border-[#E8E2D6] bg-[#FCFBF8] p-4">
                    <Text className="text-sm font-semibold text-gray-900">
                      Selected Attachments
                    </Text>

                    <Text className="mt-1 text-xs text-gray-500">
                      {attachments.length} file
                      {attachments.length === 1
                        ? ""
                        : "s"} selected
                    </Text>

                    <View className="mt-3 gap-3">
                      {attachments.map(
                        (file, index) => (
                          <View
                            key={`${file.name}-${index}`}
                            className="flex-row items-center rounded-xl border border-[#F0ECE4] bg-white p-3"
                          >
                            <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#B8860B]/10">
                              <FileText
                                size={19}
                                color="#B8860B"
                              />
                            </View>

                            <View className="ml-3 flex-1">
                              <Text
                                numberOfLines={1}
                                className="text-sm font-medium text-gray-800"
                              >
                                {file.name}
                              </Text>

                              <Text className="mt-1 text-xs text-gray-500">
                                {formatFileSize(
                                  file.size
                                )}
                              </Text>
                            </View>

                            <Pressable
                              disabled={sending}
                              onPress={() =>
                                removeAttachment(
                                  index
                                )
                              }
                              className="ml-2 h-9 w-9 items-center justify-center rounded-lg active:bg-red-50"
                            >
                              <X
                                size={18}
                                color="#9CA3AF"
                              />
                            </Pressable>
                          </View>
                        )
                      )}
                    </View>
                  </View>
                )}
              </View>

              {/* SEND BUTTON */}

              <Pressable
                disabled={sending}
                onPress={handleSend}
                className={`mt-6 flex-row items-center justify-center rounded-xl py-4 ${sending
                  ? "bg-gray-400"
                  : "bg-[#B8860B]"
                  }`}
              >
                {sending ? (
                  <>
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />

                    <Text className="ml-2 text-sm font-bold text-white">
                      Sending...
                    </Text>
                  </>
                ) : (
                  <>
                    <Send
                      size={17}
                      color="#FFFFFF"
                    />

                    <Text className="ml-2 text-sm font-bold text-white">
                      Send to Subscribers
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </View>

        {/* ========================================================
            SUBSCRIBERS
        ======================================================== */}

        <View className="mt-5 overflow-hidden rounded-2xl border border-[#E8E2D6] bg-white">
          {/* HEADER */}

          <View className="flex-row items-center justify-between border-b border-[#EEE7D8] bg-[#FCFBF8] px-5 py-4">
            <View>
              <Text className="text-lg font-bold text-gray-900">
                Subscribers
              </Text>

              <Text className="mt-1 text-xs text-gray-500">
                {totalCount} total subscribers
              </Text>
            </View>

            {totalCount > 6 && (
              <Pressable
                onPress={() =>
                  setShowAllModal(true)
                }
                className="rounded-lg px-2 py-2"
              >
                <Text className="text-sm font-semibold text-[#B8860B]">
                  View All
                </Text>
              </Pressable>
            )}
          </View>

          {/* CONTENT */}

          {loadingSubs ? (
            <View className="items-center py-10">
              <ActivityIndicator
                size="small"
                color="#B8860B"
              />

              <Text className="mt-3 text-sm text-gray-500">
                Loading subscribers...
              </Text>
            </View>
          ) : subscribers.length === 0 ? (
            <View className="items-center px-5 py-10">
              <Users
                size={30}
                color="#9CA3AF"
              />

              <Text className="mt-3 text-sm text-gray-500">
                No subscribers found.
              </Text>
            </View>
          ) : (
            <View>
              {subscribers
                .slice(0, 6)
                .map((subscriber) => (
                  <View
                    key={subscriber._id}
                    className="border-b border-gray-100 p-4"
                  >
                    <View className="flex-row items-start">
                      <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#B8860B]/10">
                        <Mail
                          size={18}
                          color="#B8860B"
                        />
                      </View>

                      <View className="ml-3 flex-1">
                        <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Email
                        </Text>

                        <Text
                          numberOfLines={2}
                          className="mt-1 text-sm font-medium text-gray-900"
                        >
                          {subscriber.email}
                        </Text>
                      </View>
                    </View>

                    <View className="mt-3 flex-row items-center justify-between">
                      <View>
                        <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Joined
                        </Text>

                        <Text className="mt-1 text-sm text-gray-500">
                          {new Date(
                            subscriber.createdAt
                          ).toLocaleDateString()}
                        </Text>
                      </View>

                      <View
                        className={`rounded-full px-3 py-1.5 ${subscriber.status ===
                          "Unsubscribed"
                          ? "bg-gray-100"
                          : "bg-green-100"
                          }`}
                      >
                        <Text
                          className={`text-xs font-bold ${subscriber.status ===
                            "Unsubscribed"
                            ? "text-gray-600"
                            : "text-green-700"
                            }`}
                        >
                          {subscriber.status ===
                            "Unsubscribed"
                            ? "Unsubscribed"
                            : "Active"}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}

              {totalCount > 6 && (
                <Pressable
                  onPress={() =>
                    setShowAllModal(true)
                  }
                  className="items-center border-t border-gray-100 bg-[#FCFBF8] px-5 py-4"
                >
                  <Text className="text-sm font-semibold text-[#B8860B]">
                    View All Subscribers (
                    {totalCount})
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ==========================================================
          ALL SUBSCRIBERS MODAL
      ========================================================== */}

      <Modal
        visible={showAllModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAllModal(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className="mt-auto h-[92%] overflow-hidden rounded-t-[30px] bg-white">

            {/* =====================================================
          HEADER - FIXED
      ===================================================== */}
            <View className="flex-row items-center justify-between border-b border-[#EEE7D8] bg-[#FCFBF8] px-5 py-5">
              <View className="flex-1 pr-4">
                <Text className="text-xl font-bold text-gray-900">
                  All Subscribers
                </Text>

                <Text className="mt-1 text-sm text-gray-500">
                  {totalCount} total subscribers
                </Text>
              </View>

              <Pressable
                onPress={() => setShowAllModal(false)}
                className="h-10 w-10 items-center justify-center rounded-xl border border-[#E8E2D6] bg-white"
              >
                <X
                  size={20}
                  color="#6B7280"
                />
              </Pressable>
            </View>

            {/* =====================================================
          SCROLLABLE SUBSCRIBER LIST
      ===================================================== */}
            <View className="flex-1">
              <ScrollView
                className="flex-1"
                contentContainerClassName="pb-5"
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
              >
                {subscribers.length === 0 ? (
                  <View className="items-center justify-center px-5 py-16">
                    <View className="h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                      <Mail
                        size={24}
                        color="#9CA3AF"
                      />
                    </View>

                    <Text className="mt-4 text-base font-semibold text-gray-900">
                      No Subscribers
                    </Text>

                    <Text className="mt-1 text-center text-sm text-gray-500">
                      There are currently no subscribers to display.
                    </Text>
                  </View>
                ) : (
                  subscribers.map((subscriber) => (
                    <View
                      key={subscriber._id}
                      className="border-b border-gray-100 px-5 py-4"
                    >
                      {/* EMAIL ROW */}
                      <View className="flex-row items-start">
                        <View className="h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#B8860B]/10">
                          <Mail
                            size={18}
                            color="#B8860B"
                          />
                        </View>

                        <View className="ml-3 flex-1 min-w-0">
                          <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Email
                          </Text>

                          <Text
                            className="mt-1 text-sm font-medium leading-5 text-gray-900"
                          >
                            {subscriber.email}
                          </Text>
                        </View>
                      </View>

                      {/* DATE + STATUS */}
                      <View className="mt-4 flex-row items-end justify-between gap-3">

                        {/* JOINED */}
                        <View className="flex-1">
                          <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Joined
                          </Text>

                          <Text className="mt-1 text-sm text-gray-500">
                            {new Date(
                              subscriber.createdAt
                            ).toLocaleDateString()}
                          </Text>
                        </View>

                        {/* STATUS */}
                        <View
                          className={`rounded-full px-3 py-1.5 ${subscriber.status === "Unsubscribed"
                              ? "bg-gray-100"
                              : "bg-green-100"
                            }`}
                        >
                          <Text
                            className={`text-xs font-bold ${subscriber.status === "Unsubscribed"
                                ? "text-gray-600"
                                : "text-green-700"
                              }`}
                          >
                            {subscriber.status === "Unsubscribed"
                              ? "Unsubscribed"
                              : "Active"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>

            {/* =====================================================
          FOOTER - FIXED
      ===================================================== */}
            <View className="border-t border-[#EEE7D8] bg-[#FCFBF8] p-5">
              <Pressable
                onPress={() => setShowAllModal(false)}
                className="items-center justify-center rounded-xl bg-gray-900 py-4 active:bg-gray-800"
              >
                <Text className="text-sm font-semibold text-white">
                  Close
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}