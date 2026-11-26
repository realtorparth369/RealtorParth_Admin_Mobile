import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Edit2,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react-native";

interface Testimonial {
  _id: string;
  rating: number;
  date: string;
  name: string;
  role: string;
  content: string;
  image_url?: string;
  createdAt?: string;
  updatedAt?: string;
}

type TestimonialFormState = {
  _id?: string;
  rating: number;
  date: string;
  name: string;
  role: string;
  content: string;
  image_url: string;
};

const API_URL = "https://realtorparth.ca/api/testimonials";

export default function TestimonialsScreen() {
  // =====================================================
  // DATA
  // =====================================================

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
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
  const [saving, setSaving] = useState(false);

  const [currentTestimonial, setCurrentTestimonial] =
    useState<TestimonialFormState>({
      rating: 5,
      date: new Date().toISOString().split("T")[0],
      name: "",
      role: "",
      content: "",
      image_url: "",
    });

  // =====================================================
  // DELETE
  // =====================================================

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // =====================================================
  // FETCH TESTIMONIALS
  // =====================================================

  const fetchTestimonials = async (
    isRefresh = false
  ): Promise<void> => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to fetch testimonials");
      }

      const result = await response.json();

      const testimonialsData: Testimonial[] = Array.isArray(result)
        ? result
        : result.data || result.testimonials || [];

      setTestimonials(testimonialsData);
    } catch (error) {
      console.error("Fetch testimonials error:", error);

      Alert.alert(
        "Error",
        "Failed to load testimonials. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  // =====================================================
  // FILTER
  // =====================================================

  const filteredTestimonials = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return testimonials;
    }

    return testimonials.filter((testimonial) => {
      return (
        testimonial.name
          ?.toLowerCase()
          .includes(query) ||
        testimonial.role
          ?.toLowerCase()
          .includes(query) ||
        testimonial.content
          ?.toLowerCase()
          .includes(query) ||
        testimonial.date
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [testimonials, searchTerm]);

  // =====================================================
  // ADD NEW
  // =====================================================

  const handleAddNew = () => {
    setCurrentTestimonial({
      rating: 5,
      date: new Date().toISOString().split("T")[0],
      name: "",
      role: "",
      content: "",
      image_url: "",
    });

    setIsEditing(true);
  };

  // =====================================================
  // EDIT
  // =====================================================

  const handleEdit = (testimonial: Testimonial) => {
    setCurrentTestimonial({
      _id: testimonial._id,
      rating: testimonial.rating || 5,
      date: testimonial.date || "",
      name: testimonial.name || "",
      role: testimonial.role || "",
      content: testimonial.content || "",
      image_url: testimonial.image_url || "",
    });

    setIsEditing(true);
  };

  // =====================================================
  // CANCEL FORM
  // =====================================================

  const handleCancel = () => {
    if (saving) return;

    setIsEditing(false);

    setCurrentTestimonial({
      rating: 5,
      date: new Date().toISOString().split("T")[0],
      name: "",
      role: "",
      content: "",
      image_url: "",
    });
  };

  // =====================================================
  // SAVE
  // =====================================================

  const handleSave = async () => {
    if (!currentTestimonial.name.trim()) {
      Alert.alert(
        "Missing Client Name",
        "Please enter the client name."
      );
      return;
    }

    if (!currentTestimonial.content.trim()) {
      Alert.alert(
        "Missing Review",
        "Please enter the review content."
      );
      return;
    }

    if (!currentTestimonial.date.trim()) {
      Alert.alert(
        "Missing Date",
        "Please enter the testimonial date."
      );
      return;
    }

    if (
      currentTestimonial.rating < 1 ||
      currentTestimonial.rating > 5
    ) {
      Alert.alert(
        "Invalid Rating",
        "Rating must be between 1 and 5."
      );
      return;
    }

    try {
      setSaving(true);

      const isUpdate = Boolean(
        currentTestimonial._id
      );

      const endpoint = isUpdate
        ? `${API_URL}/${currentTestimonial._id}`
        : API_URL;

      const method = isUpdate ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...currentTestimonial,
          image_url:
            currentTestimonial.image_url?.trim() || undefined,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to save testimonial";

        try {
          const errorData = await response.json();

          errorMessage =
            errorData?.message ||
            errorData?.error ||
            errorMessage;
        } catch {
          // Ignore JSON parsing error
        }

        throw new Error(errorMessage);
      }

      Alert.alert(
        "Success",
        isUpdate
          ? "Testimonial updated successfully."
          : "Testimonial created successfully."
      );

      setIsEditing(false);

      setCurrentTestimonial({
        rating: 5,
        date: new Date().toISOString().split("T")[0],
        name: "",
        role: "",
        content: "",
        image_url: "",
      });

      await fetchTestimonials();
    } catch (error: any) {
      console.error("Save testimonial error:", error);

      Alert.alert(
        "Error",
        error?.message ||
          "Failed to save testimonial. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Testimonial",
      "Are you sure you want to delete this testimonial?",
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

              const response = await fetch(
                `${API_URL}/${id}`,
                {
                  method: "DELETE",
                }
              );

              if (!response.ok) {
                throw new Error(
                  "Failed to delete testimonial"
                );
              }

              setTestimonials((prev) =>
                prev.filter(
                  (testimonial) =>
                    testimonial._id !== id
                )
              );

              Alert.alert(
                "Deleted",
                "Testimonial deleted successfully."
              );
            } catch (error) {
              console.error(
                "Delete testimonial error:",
                error
              );

              Alert.alert(
                "Error",
                "Failed to delete testimonial. Please try again."
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
  // UPDATE FORM FIELD
  // =====================================================

  const updateField = <K extends keyof TestimonialFormState>(
    field: K,
    value: TestimonialFormState[K]
  ) => {
    setCurrentTestimonial((prev) => ({
      ...prev,
      [field]: value,
    }));
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
          Loading testimonials...
        </Text>
      </View>
    );
  }

  // =====================================================
  // EDIT / ADD SCREEN
  // =====================================================

  if (isEditing) {
    return (
      <View className="flex-1 bg-[#FAFAF8]">
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-5 pb-10"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* =================================================
              HEADER
          ================================================= */}

          <View className="mb-6 flex-row items-center">
            <Pressable
              disabled={saving}
              onPress={handleCancel}
              className="mr-3 h-11 w-11 items-center justify-center rounded-xl border border-[#E8E2D6] bg-white"
            >
              <X
                size={21}
                color="#374151"
              />
            </Pressable>

            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">
                {currentTestimonial._id
                  ? "Edit Testimonial"
                  : "New Testimonial"}
              </Text>

              <Text className="mt-1 text-sm text-gray-500">
                {currentTestimonial._id
                  ? "Update this client review."
                  : "Add a new client review."}
              </Text>
            </View>
          </View>

          {/* =================================================
              FORM CARD
          ================================================= */}

          <View className="rounded-2xl border border-[#E8E2D6] bg-white p-5">
            {/* =================================================
                CLIENT NAME
            ================================================= */}

            <View>
              <Text className="mb-2 text-sm font-semibold text-gray-700">
                Client Name
              </Text>

              <TextInput
                value={currentTestimonial.name}
                onChangeText={(value) =>
                  updateField("name", value)
                }
                placeholder="Enter client name..."
                placeholderTextColor="#9CA3AF"
                editable={!saving}
                className="rounded-xl border border-[#E8E2D6] bg-white px-4 py-3.5 text-base text-gray-900"
              />
            </View>

            {/* =================================================
                ROLE
            ================================================= */}

            <View className="mt-5">
              <Text className="mb-2 text-sm font-semibold text-gray-700">
                Role
              </Text>

              <TextInput
                value={currentTestimonial.role}
                onChangeText={(value) =>
                  updateField("role", value)
                }
                placeholder="e.g. Buyer, Seller, Homeowner..."
                placeholderTextColor="#9CA3AF"
                editable={!saving}
                className="rounded-xl border border-[#E8E2D6] bg-white px-4 py-3.5 text-base text-gray-900"
              />
            </View>

            {/* =================================================
                RATING
            ================================================= */}

            <View className="mt-5">
              <Text className="mb-2 text-sm font-semibold text-gray-700">
                Rating
              </Text>

              <View className="flex-row items-center rounded-xl border border-[#E8E2D6] bg-[#FCFBF8] px-4 py-4">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active =
                    star <=
                    currentTestimonial.rating;

                  return (
                    <Pressable
                      key={star}
                      disabled={saving}
                      onPress={() =>
                        updateField(
                          "rating",
                          star
                        )
                      }
                      className="mr-3"
                    >
                      <Star
                        size={28}
                        color={
                          active
                            ? "#B8860B"
                            : "#D1D5DB"
                        }
                        fill={
                          active
                            ? "#B8860B"
                            : "transparent"
                        }
                      />
                    </Pressable>
                  );
                })}

                <Text className="ml-1 text-sm font-medium text-gray-600">
                  {currentTestimonial.rating}/5
                </Text>
              </View>
            </View>

            {/* =================================================
                DATE
            ================================================= */}

            <View className="mt-5">
              <Text className="mb-2 text-sm font-semibold text-gray-700">
                Date
              </Text>

              <TextInput
                value={currentTestimonial.date}
                onChangeText={(value) =>
                  updateField("date", value)
                }
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
                editable={!saving}
                className="rounded-xl border border-[#E8E2D6] bg-white px-4 py-3.5 text-base text-gray-900"
              />

              <Text className="mt-2 text-xs text-gray-400">
                Example: 2026-09-03
              </Text>
            </View>

            {/* =================================================
                REVIEW CONTENT
            ================================================= */}

            <View className="mt-5">
              <Text className="mb-2 text-sm font-semibold text-gray-700">
                Review Content
              </Text>

              <TextInput
                value={currentTestimonial.content}
                onChangeText={(value) =>
                  updateField(
                    "content",
                    value
                  )
                }
                placeholder="Enter the client's review..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={7}
                textAlignVertical="top"
                editable={!saving}
                className="min-h-[180px] rounded-xl border border-[#E8E2D6] bg-white px-4 py-3.5 text-base leading-6 text-gray-900"
              />
            </View>

            {/* =================================================
                IMAGE URL
            ================================================= */}

            <View className="mt-5">
              <Text className="mb-2 text-sm font-semibold text-gray-700">
                Image URL
              </Text>

              <TextInput
                value={
                  currentTestimonial.image_url
                }
                onChangeText={(value) =>
                  updateField(
                    "image_url",
                    value
                  )
                }
                placeholder="https://..."
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                keyboardType="url"
                editable={!saving}
                className="rounded-xl border border-[#E8E2D6] bg-white px-4 py-3.5 text-base text-gray-900"
              />

              <Text className="mt-2 text-xs text-gray-400">
                Optional. Add a public image URL for
                the client.
              </Text>
            </View>

            {/* =================================================
                IMAGE PREVIEW
            ================================================= */}

            {currentTestimonial.image_url.trim() ? (
              <View className="mt-5 overflow-hidden rounded-2xl border border-[#E8E2D6] bg-[#FCFBF8]">
                <Text className="px-4 pt-4 text-sm font-semibold text-gray-700">
                  Image Preview
                </Text>

                <Image
                  source={{
                    uri: currentTestimonial.image_url,
                  }}
                  className="mx-4 mb-4 mt-3 h-48 rounded-xl"
                  resizeMode="cover"
                />
              </View>
            ) : null}
          </View>

          {/* =================================================
              BUTTONS
          ================================================= */}

          <View className="mt-5 flex-row gap-3">
            <Pressable
              disabled={saving}
              onPress={handleCancel}
              className="flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white py-4 active:bg-gray-50"
            >
              <Text className="text-sm font-semibold text-gray-700">
                Cancel
              </Text>
            </Pressable>

            <Pressable
              disabled={saving}
              onPress={handleSave}
              className={`flex-[1.4] flex-row items-center justify-center rounded-xl py-4 ${
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
                <Text className="text-sm font-semibold text-white">
                  {currentTestimonial._id
                    ? "Update Review"
                    : "Save Review"}
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
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
              fetchTestimonials(true)
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
          <View className="self-start rounded-full border border-[#B8860B]/20 bg-[#B8860B]/10 px-3 py-1">
            <Text className="text-xs font-bold uppercase tracking-wider text-[#B8860B]">
              Client Reviews
            </Text>
          </View>

          <View className="mt-3 flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-3xl font-bold tracking-tight text-gray-900">
                Testimonials
              </Text>

              <Text className="mt-2 text-sm leading-5 text-gray-500">
                Manage client reviews and success
                stories.
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
              placeholder="Search client, role, review..."
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
            COUNT
        ================================================= */}

        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-gray-700">
            {filteredTestimonials.length} Review
            {filteredTestimonials.length !== 1
              ? "s"
              : ""}
          </Text>

          <Text className="text-xs text-gray-400">
            Total {testimonials.length}
          </Text>
        </View>

        {/* =================================================
            EMPTY
        ================================================= */}

        {filteredTestimonials.length === 0 ? (
          <View className="items-center rounded-2xl border border-[#E8E2D6] bg-white px-5 py-16">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-[#B8860B]/10">
              <Star
                size={28}
                color="#B8860B"
              />
            </View>

            <Text className="mt-5 text-lg font-semibold text-gray-900">
              No testimonials found
            </Text>

            <Text className="mt-2 text-center text-sm leading-5 text-gray-500">
              {searchTerm
                ? "Try changing your search."
                : "Add your first testimonial to get started."}
            </Text>

            {!searchTerm && (
              <Pressable
                onPress={handleAddNew}
                className="mt-5 flex-row items-center rounded-xl bg-[#B8860B] px-5 py-3 active:opacity-80"
              >
                <Plus
                  size={18}
                  color="#FFFFFF"
                />

                <Text className="ml-2 text-sm font-semibold text-white">
                  Add Testimonial
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          /* =================================================
             TESTIMONIAL CARDS
          ================================================= */

          <View className="gap-5">
            {filteredTestimonials.map(
              (testimonial) => (
                <View
                  key={testimonial._id}
                  className="overflow-hidden rounded-2xl border border-[#E8E2D6] bg-white shadow-sm"
                >
                  {/* =================================================
                      CARD HEADER
                  ================================================= */}

                  <View className="border-b border-[#F3EEE6] p-5">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 flex-row items-center pr-3">
                        {testimonial.image_url ? (
                          <Image
                            source={{
                              uri: testimonial.image_url,
                            }}
                            className="h-12 w-12 rounded-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="h-12 w-12 items-center justify-center rounded-full bg-[#B8860B]/10">
                            <Text className="text-lg font-bold text-[#B8860B]">
                              {testimonial.name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "?"}
                            </Text>
                          </View>
                        )}

                        <View className="ml-3 flex-1">
                          <Text
                            numberOfLines={1}
                            className="text-base font-bold text-gray-900"
                          >
                            {
                              testimonial.name
                            }
                          </Text>

                          {testimonial.role ? (
                            <Text
                              numberOfLines={
                                1
                              }
                              className="mt-1 text-xs text-gray-500"
                            >
                              {
                                testimonial.role
                              }
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      {/* RATING */}

                      <View className="flex-row items-center">
                        <Star
                          size={15}
                          color="#B8860B"
                          fill="#B8860B"
                        />

                        <Text className="ml-1 text-xs font-semibold text-[#B8860B]">
                          {
                            testimonial.rating
                          }
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* =================================================
                      CARD BODY
                  ================================================= */}

                  <View className="p-5">
                    {/* STARS */}

                    <View className="mb-4 flex-row">
                      {[1, 2, 3, 4, 5].map(
                        (star) => (
                          <Star
                            key={star}
                            size={17}
                            color={
                              star <=
                              testimonial.rating
                                ? "#B8860B"
                                : "#D1D5DB"
                            }
                            fill={
                              star <=
                              testimonial.rating
                                ? "#B8860B"
                                : "transparent"
                            }
                            style={{
                              marginRight: 4,
                            }}
                          />
                        )
                      )}
                    </View>

                    {/* REVIEW */}

                    <View className="rounded-xl border border-[#EEE7D8] bg-[#FCFBF8] p-4">
                      <Text
                        numberOfLines={6}
                        className="text-sm leading-6 text-gray-600"
                      >
                        "{testimonial.content}"
                      </Text>
                    </View>

                    {/* =================================================
                        FOOTER
                    ================================================= */}

                    <View className="mt-5 flex-row items-center justify-between">
                      <Text className="text-xs text-gray-400">
                        {testimonial.date}
                      </Text>

                      <View className="flex-row items-center gap-2">
                        {/* EDIT */}

                        <Pressable
                          onPress={() =>
                            handleEdit(
                              testimonial
                            )
                          }
                          className="h-10 w-10 items-center justify-center rounded-xl border border-[#E8E2D6] bg-white active:bg-[#B8860B]/10"
                        >
                          <Edit2
                            size={17}
                            color="#B8860B"
                          />
                        </Pressable>

                        {/* DELETE */}

                        <Pressable
                          disabled={
                            deletingId ===
                            testimonial._id
                          }
                          onPress={() =>
                            handleDelete(
                              testimonial._id
                            )
                          }
                          className="h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-white active:bg-red-50"
                        >
                          {deletingId ===
                          testimonial._id ? (
                            <ActivityIndicator
                              size="small"
                              color="#DC2626"
                            />
                          ) : (
                            <Trash2
                              size={17}
                              color="#DC2626"
                            />
                          )}
                        </Pressable>
                      </View>
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