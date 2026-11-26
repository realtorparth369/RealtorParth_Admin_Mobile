import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  MessageCircleQuestion,
  X,
  Save,
  ArrowLeft,
} from "lucide-react-native";

interface FAQ {
  _id: string;
  category: string;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
}

interface FAQFormState {
  _id?: string;
  category: string;
  question: string;
  answer: string;
}

const API_URL = "https://realtorparth.ca";

const EMPTY_FORM: FAQFormState = {
  category: "General",
  question: "",
  answer: "",
};

export default function FaqsScreen() {
  // =====================================================
  // DATA
  // =====================================================

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =====================================================
  // SEARCH
  // =====================================================

  const [searchTerm, setSearchTerm] = useState("");

  // =====================================================
  // FORM
  // =====================================================

  const [isEditing, setIsEditing] = useState(false);

  const [currentFaq, setCurrentFaq] =
    useState<FAQFormState>(EMPTY_FORM);

  const [saving, setSaving] = useState(false);

  // =====================================================
  // DELETE
  // =====================================================

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  // =====================================================
  // FETCH FAQs
  // =====================================================

  const fetchFAQs = async (
    isRefresh = false
  ): Promise<void> => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(
        `${API_URL}/api/faqs`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch FAQs");
      }

      const data: FAQ[] = await response.json();

      setFaqs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        "Fetch FAQs error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to load FAQs. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    void fetchFAQs();
  }, []);

  // =====================================================
  // FILTER
  // =====================================================

  const filteredFaqs = useMemo(() => {
    const query =
      searchTerm.trim().toLowerCase();

    if (!query) {
      return faqs;
    }

    return faqs.filter((faq) => {
      return (
        faq.question
          ?.toLowerCase()
          .includes(query) ||
        faq.category
          ?.toLowerCase()
          .includes(query) ||
        faq.answer
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [faqs, searchTerm]);

  // =====================================================
  // ADD NEW
  // =====================================================

  const handleAddNew = (): void => {
    setCurrentFaq({
      ...EMPTY_FORM,
    });

    setIsEditing(true);
  };

  // =====================================================
  // EDIT
  // =====================================================

  const handleEdit = (faq: FAQ): void => {
    setCurrentFaq({
      _id: faq._id,
      category: faq.category || "General",
      question: faq.question || "",
      answer: faq.answer || "",
    });

    setIsEditing(true);
  };

  // =====================================================
  // CANCEL FORM
  // =====================================================

  const handleCancel = (): void => {
    if (saving) {
      return;
    }

    setIsEditing(false);

    setCurrentFaq({
      ...EMPTY_FORM,
    });
  };

  // =====================================================
  // SAVE FAQ
  // =====================================================

  const handleSave = async (): Promise<void> => {
    const category =
      currentFaq.category.trim();

    const question =
      currentFaq.question.trim();

    const answer =
      currentFaq.answer.trim();

    if (!category) {
      Alert.alert(
        "Missing Category",
        "Please enter a category."
      );
      return;
    }

    if (!question) {
      Alert.alert(
        "Missing Question",
        "Please enter the FAQ question."
      );
      return;
    }

    if (!answer) {
      Alert.alert(
        "Missing Answer",
        "Please enter the FAQ answer."
      );
      return;
    }

    try {
      setSaving(true);

      const isUpdate = Boolean(
        currentFaq._id
      );

      const method: "POST" | "PUT" =
        isUpdate ? "PUT" : "POST";

      const endpoint = isUpdate
        ? `${API_URL}/api/faqs/${currentFaq._id}`
        : `${API_URL}/api/faqs`;

      const response = await fetch(
        endpoint,
        {
          method,
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            category,
            question,
            answer,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to save FAQ"
        );
      }

      Alert.alert(
        "Success",
        isUpdate
          ? "FAQ updated successfully."
          : "FAQ created successfully."
      );

      setIsEditing(false);

      setCurrentFaq({
        ...EMPTY_FORM,
      });

      await fetchFAQs();
    } catch (error) {
      console.error(
        "Save FAQ error:",
        error
      );

      Alert.alert(
        "Error",
        isEditing && currentFaq._id
          ? "Failed to update FAQ. Please try again."
          : "Failed to create FAQ. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE FAQ
  // =====================================================

  const handleDelete = (
    id: string
  ): void => {
    Alert.alert(
      "Delete FAQ",
      "Are you sure you want to delete this FAQ?",
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
                  `${API_URL}/api/faqs/${id}`,
                  {
                    method: "DELETE",
                  }
                );

              if (!response.ok) {
                throw new Error(
                  "Delete failed"
                );
              }

              setFaqs((prev) =>
                prev.filter(
                  (faq) =>
                    faq._id !== id
                )
              );

              Alert.alert(
                "Deleted",
                "FAQ deleted successfully."
              );
            } catch (error) {
              console.error(
                "Delete FAQ error:",
                error
              );

              Alert.alert(
                "Error",
                "Failed to delete FAQ. Please try again."
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
  // FORM SCREEN
  // =====================================================

  if (isEditing) {
    return (
      <View className="flex-1 bg-[#FAFAF8]">
        {/* =================================================
            HEADER
        ================================================= */}

        <View className="border-b border-[#EEE7D8] bg-white px-5 py-4">
          <View className="flex-row items-center">
            <Pressable
              disabled={saving}
              onPress={handleCancel}
              className="mr-3 h-10 w-10 items-center justify-center rounded-xl border border-[#E8E2D6] bg-white active:bg-gray-50"
            >
              <ArrowLeft
                size={20}
                color="#374151"
              />
            </Pressable>

            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900">
                {currentFaq._id
                  ? "Edit FAQ"
                  : "New FAQ"}
              </Text>

              <Text className="mt-0.5 text-xs text-gray-500">
                {currentFaq._id
                  ? "Update this frequently asked question"
                  : "Create a new frequently asked question"}
              </Text>
            </View>
          </View>
        </View>

        {/* =================================================
            FORM
        ================================================= */}

        <ScrollView
          className="flex-1"
          contentContainerClassName="p-5 pb-10"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* =================================================
              FORM CARD
          ================================================= */}

          <View className="rounded-2xl border border-[#E8E2D6] bg-white p-5 shadow-sm">
            {/* =================================================
                CATEGORY
            ================================================= */}

            <View>
              <Text className="mb-2 text-sm font-semibold text-gray-700">
                Category
              </Text>

              <TextInput
                value={currentFaq.category}
                onChangeText={(value) =>
                  setCurrentFaq(
                    (prev) => ({
                      ...prev,
                      category: value,
                    })
                  )
                }
                placeholder="e.g. General"
                placeholderTextColor="#9CA3AF"
                editable={!saving}
                className="rounded-xl border border-[#E8E2D6] bg-white px-4 py-3.5 text-base text-gray-900"
              />
            </View>

            {/* =================================================
                QUESTION
            ================================================= */}

            <View className="mt-5">
              <Text className="mb-2 text-sm font-semibold text-gray-700">
                Question
              </Text>

              <TextInput
                value={currentFaq.question}
                onChangeText={(value) =>
                  setCurrentFaq(
                    (prev) => ({
                      ...prev,
                      question: value,
                    })
                  )
                }
                placeholder="Enter the frequently asked question..."
                placeholderTextColor="#9CA3AF"
                editable={!saving}
                multiline
                textAlignVertical="top"
                className="min-h-[100px] rounded-xl border border-[#E8E2D6] bg-white px-4 py-3.5 text-base leading-6 text-gray-900"
              />
            </View>

            {/* =================================================
                ANSWER
            ================================================= */}

            <View className="mt-5">
              <Text className="mb-2 text-sm font-semibold text-gray-700">
                Answer
              </Text>

              <TextInput
                value={currentFaq.answer}
                onChangeText={(value) =>
                  setCurrentFaq(
                    (prev) => ({
                      ...prev,
                      answer: value,
                    })
                  )
                }
                placeholder="Enter the answer..."
                placeholderTextColor="#9CA3AF"
                editable={!saving}
                multiline
                textAlignVertical="top"
                className="min-h-[220px] rounded-xl border border-[#E8E2D6] bg-white px-4 py-3.5 text-base leading-6 text-gray-900"
              />
            </View>
          </View>

          {/* =================================================
              INFO
          ================================================= */}

          <View className="mt-4 rounded-2xl border border-[#E8E2D6] bg-[#FCFBF8] p-4">
            <View className="flex-row items-start">
              <View className="h-9 w-9 items-center justify-center rounded-lg bg-[#B8860B]/10">
                <MessageCircleQuestion
                  size={18}
                  color="#B8860B"
                />
              </View>

              <View className="ml-3 flex-1">
                <Text className="text-sm font-semibold text-gray-900">
                  SEO-friendly FAQ
                </Text>

                <Text className="mt-1 text-xs leading-5 text-gray-500">
                  Keep the question clear and
                  make the answer helpful and
                  easy for homeowners to
                  understand.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* =================================================
            FORM FOOTER
        ================================================= */}

        <View className="border-t border-[#EEE7D8] bg-white p-5">
          <View className="flex-row gap-3">
            {/* CANCEL */}

            <Pressable
              disabled={saving}
              onPress={handleCancel}
              className="flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white py-3.5 active:bg-gray-50"
            >
              <Text className="text-sm font-medium text-gray-700">
                Cancel
              </Text>
            </Pressable>

            {/* SAVE */}

            <Pressable
              disabled={saving}
              onPress={handleSave}
              className={`flex-[1.4] flex-row items-center justify-center rounded-xl py-3.5 ${
                saving
                  ? "bg-[#B8860B]/60"
                  : "bg-[#B8860B]"
              }`}
            >
              {saving ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />

                  <Text className="ml-2 text-sm font-semibold text-white">
                    Saving...
                  </Text>
                </>
              ) : (
                <>
                  <Save
                    size={17}
                    color="#FFFFFF"
                  />

                  <Text className="ml-2 text-sm font-semibold text-white">
                    {currentFaq._id
                      ? "Update FAQ"
                      : "Save Question"}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

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

        <Text className="mt-4 text-sm text-gray-500">
          Loading FAQs...
        </Text>
      </View>
    );
  }

  // =====================================================
  // MAIN SCREEN
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
              fetchFAQs(true)
            }
            tintColor="#B8860B"
          />
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <View className="mb-6">
          <View className="self-start rounded-full bg-[#B8860B]/10 px-3 py-1">
            <Text className="text-xs font-bold uppercase tracking-wider text-[#B8860B]">
              Content Management
            </Text>
          </View>

          <View className="mt-3 flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-3xl font-bold tracking-tight text-gray-900">
                FAQ Management
              </Text>

              <Text className="mt-2 text-sm leading-5 text-gray-500">
                Manage common questions and
                boost SEO visibility.
              </Text>
            </View>

            <Pressable
              onPress={handleAddNew}
              className="h-12 w-12 items-center justify-center rounded-xl bg-[#B8860B] shadow-sm active:opacity-80"
            >
              <Plus
                size={22}
                color="#FFFFFF"
              />
            </Pressable>
          </View>
        </View>

        {/* =================================================
            SEARCH
        ================================================= */}

        <View className="mb-5 rounded-2xl border border-[#E8E2D6] bg-white p-3 shadow-sm">
          <View className="flex-row items-center">
            <Search
              size={20}
              color="#9CA3AF"
            />

            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search questions..."
              placeholderTextColor="#9CA3AF"
              className="ml-3 flex-1 py-1 text-base text-gray-900"
            />

            {searchTerm.length > 0 && (
              <Pressable
                onPress={() =>
                  setSearchTerm("")
                }
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

        {/* =================================================
            RESULT COUNT
        ================================================= */}

        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-gray-700">
            {filteredFaqs.length} FAQ
            {filteredFaqs.length !== 1
              ? "s"
              : ""}
          </Text>

          <Text className="text-xs text-gray-400">
            {searchTerm.trim()
              ? `Showing ${filteredFaqs.length} results`
              : "All questions"}
          </Text>
        </View>

        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {filteredFaqs.length === 0 ? (
          <View className="items-center rounded-2xl border border-[#E8E2D6] bg-white px-5 py-16">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-[#B8860B]/10">
              <MessageCircleQuestion
                size={30}
                color="#B8860B"
              />
            </View>

            <Text className="mt-5 text-lg font-semibold text-gray-900">
              {searchTerm.trim()
                ? "No FAQs found"
                : "No FAQs yet"}
            </Text>

            <Text className="mt-2 text-center text-sm leading-5 text-gray-500">
              {searchTerm.trim()
                ? "Try changing your search terms."
                : "Create your first FAQ question to get started."}
            </Text>

            {!searchTerm.trim() && (
              <Pressable
                onPress={handleAddNew}
                className="mt-5 flex-row items-center rounded-xl bg-[#B8860B] px-5 py-3 active:opacity-80"
              >
                <Plus
                  size={17}
                  color="#FFFFFF"
                />

                <Text className="ml-2 text-sm font-semibold text-white">
                  Add Question
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          /* =================================================
             FAQ CARDS
          ================================================= */

          <View className="gap-4">
            {filteredFaqs.map(
              (faq) => (
                <View
                  key={faq._id}
                  className="overflow-hidden rounded-2xl border border-[#E8E2D6] bg-white shadow-sm"
                >
                  {/* =================================================
                      CARD CONTENT
                  ================================================= */}

                  <View className="p-5">
                    <View className="flex-row items-start">
                      <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#B8860B]/10">
                        <MessageCircleQuestion
                          size={19}
                          color="#B8860B"
                        />
                      </View>

                      <View className="ml-3 flex-1">
                        <View className="flex-row items-start justify-between">
                          <View className="flex-1 pr-2">
                            <Text className="text-base font-semibold leading-6 text-gray-900">
                              {faq.question}
                            </Text>
                          </View>

                          <View className="rounded-full bg-gray-100 px-3 py-1">
                            <Text className="max-w-[100px] text-xs font-medium text-gray-600">
                              {faq.category}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* =================================================
                        ANSWER
                    ================================================= */}

                    <View className="mt-4 rounded-xl border border-[#F1ECE4] bg-[#FAFAF8] p-4">
                      <Text
                        numberOfLines={5}
                        className="text-sm leading-6 text-gray-600"
                      >
                        {faq.answer}
                      </Text>
                    </View>

                    {/* =================================================
                        DATE
                    ================================================= */}

                    {faq.updatedAt && (
                      <Text className="mt-3 text-xs text-gray-400">
                        Updated{" "}
                        {new Date(
                          faq.updatedAt
                        ).toLocaleDateString()}
                      </Text>
                    )}

                    {/* =================================================
                        ACTIONS
                    ================================================= */}

                    <View className="mt-4 flex-row gap-3">
                      {/* EDIT */}

                      <Pressable
                        onPress={() =>
                          handleEdit(
                            faq
                          )
                        }
                        className="flex-1 flex-row items-center justify-center rounded-xl border border-[#B8860B]/30 bg-[#B8860B]/5 py-3 active:bg-[#B8860B]/10"
                      >
                        <Edit2
                          size={16}
                          color="#B8860B"
                        />

                        <Text className="ml-2 text-sm font-semibold text-[#B8860B]">
                          Edit
                        </Text>
                      </Pressable>

                      {/* DELETE */}

                      <Pressable
                        disabled={
                          deletingId ===
                          faq._id
                        }
                        onPress={() =>
                          handleDelete(
                            faq._id
                          )
                        }
                        className="flex-1 flex-row items-center justify-center rounded-xl border border-red-200 bg-white py-3 active:bg-red-50"
                      >
                        {deletingId ===
                        faq._id ? (
                          <ActivityIndicator
                            size="small"
                            color="#DC2626"
                          />
                        ) : (
                          <>
                            <Trash2
                              size={16}
                              color="#DC2626"
                            />

                            <Text className="ml-2 text-sm font-semibold text-red-600">
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
        )}
      </ScrollView>
    </View>
  );
}