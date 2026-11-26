import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from "react-native";

import {
    useCallback,
    useState,
} from "react";

import {
    useFocusEffect,
    useRouter,
} from "expo-router";

import {
    Ionicons,
} from "@expo/vector-icons";

import axios from "axios";

/* =========================================================
   API
========================================================= */

const API_URL =
    "https://realtorparth.ca";

/* =========================================================
   TYPES
========================================================= */

interface CommunityPage {
    _id: string;
    community: string;
    slug: string;
    updatedAt: string;
}

/* =========================================================
   SCREEN
========================================================= */

export default function CommunityListScreen() {
    const router = useRouter();

    const [data, setData] =
        useState<CommunityPage[]>([]);

    const [selected, setSelected] =
        useState<string[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    /* =======================================================
       FETCH DATA
    ======================================================= */

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            // console.log(
            //     "===================================="
            // );

            // console.log(
            //     "Fetching communities..."
            // );

            /* ------------------------------------------------
               FETCH COMMUNITIES
            ------------------------------------------------ */

            const communitiesRes =
                await axios.get(
                    `${API_URL}/api/communityDetails/admin/community-pages`
                );

            const communities =
                communitiesRes.data || [];

            // console.log(
            //     "Communities loaded:",
            //     communities.length
            // );

            // console.log(
            //     "Community data:",
            //     communities
            // );

            setData(communities);

            /* ------------------------------------------------
               FETCH SELECTED COMMUNITIES
            ------------------------------------------------ */

            const selectedRes =
                await axios.get(
                    `${API_URL}/api/communityDetails/selected`
                );

            const selectedIds =
                selectedRes.data?.selected || [];

            // console.log(
            //     "Selected communities:",
            //     selectedIds
            // );

            setSelected(selectedIds);

            // console.log(
            //     "===================================="
            // );
        } catch (error: any) {
            // console.error(
            //     "===================================="
            // );

            // console.error(
            //     "Failed to fetch communities:"
            // );

            // console.error(
            //     "Status:",
            //     error?.response?.status
            // );

            // console.error(
            //     "Response:",
            //     error?.response?.data
            // );

            // console.error(
            //     "Message:",
            //     error?.message
            // );

            // console.error(
            //     "===================================="
            // );

            Alert.alert(
                "Error",
                error?.response?.data?.error ||
                    error?.response?.data?.message ||
                    "Failed to load community pages."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    /* =======================================================
       REFRESH WHEN SCREEN APPEARS / GETS FOCUS
    ======================================================= */

    useFocusEffect(
        useCallback(() => {
            // console.log(
            //     "Community index focused - refreshing data..."
            // );

            fetchData();
        }, [fetchData])
    );

    /* =======================================================
       PULL TO REFRESH
    ======================================================= */

    const onRefresh =
        useCallback(async () => {
            try {
                setRefreshing(true);

                await fetchData();
            } finally {
                setRefreshing(false);
            }
        }, [fetchData]);

    /* =======================================================
       TOGGLE SELECT
    ======================================================= */

    const toggleSelect = (
        id: string
    ) => {
        setSelected((prev) =>
            prev.includes(id)
                ? prev.filter(
                      (item) => item !== id
                  )
                : [
                      ...prev,
                      id,
                  ]
        );
    };

    /* =======================================================
       SELECT ALL
    ======================================================= */

    const handleSelectAll = () => {
        if (
            selected.length ===
            data.length
        ) {
            setSelected([]);

            return;
        }

        setSelected(
            data.map(
                (item) => item._id
            )
        );
    };

    /* =======================================================
       SAVE SELECTED
    ======================================================= */

    const handleSaveSelected =
        async () => {
            try {
                await axios.post(
                    `${API_URL}/api/communityDetails/save-selected`,
                    {
                        selected,
                    }
                );

                Alert.alert(
                    "Success",
                    "Selected communities saved."
                );
            } catch (error: any) {
                // console.error(
                //     "Failed to save selection:",
                //     error?.response?.data ||
                //         error
                // );

                Alert.alert(
                    "Error",
                    error?.response?.data?.error ||
                        error?.response?.data?.message ||
                        "Failed to save selection."
                );
            }
        };

    /* =======================================================
       DELETE
    ======================================================= */

    const handleDelete = (
        id: string
    ) => {
        Alert.alert(
            "Delete Community",
            "Are you sure you want to delete this community page?",
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
                            // console.log(
                            //     "Deleting community:",
                            //     id
                            // );

                            await axios.delete(
                                `${API_URL}/api/communityDetails/admin/community-pages/${id}`
                            );

                            /* --------------------------------
                               REMOVE FROM LOCAL LIST
                            -------------------------------- */

                            setData(
                                (prev) =>
                                    prev.filter(
                                        (item) =>
                                            item._id !==
                                            id
                                    )
                            );

                            /* --------------------------------
                               REMOVE FROM SELECTED
                            -------------------------------- */

                            setSelected(
                                (prev) =>
                                    prev.filter(
                                        (item) =>
                                            item !== id
                                    )
                            );

                            Alert.alert(
                                "Success",
                                "Community page deleted."
                            );

                            /* --------------------------------
                               REFRESH FROM SERVER
                            -------------------------------- */

                            await fetchData();
                        } catch (error: any) {
                            // console.error(
                            //     "Delete failed:",
                            //     error?.response?.data ||
                            //         error
                            // );

                            Alert.alert(
                                "Error",
                                error?.response?.data?.error ||
                                    error?.response?.data?.message ||
                                    "Failed to delete community page."
                            );
                        }
                    },
                },
            ]
        );
    };

    /* =======================================================
       OPEN NEW COMMUNITY
    ======================================================= */

    const handleNewCommunity = () => {
        // console.log(
        //     "Opening new community..."
        // );

        router.push(
            "/(admin)/community/new"
        );
    };

    /* =======================================================
       OPEN EDIT COMMUNITY
    ======================================================= */

    const handleEditCommunity = (
        id: string
    ) => {
        // console.log(
        //     "Opening community:",
        //     id
        // );

        router.push(
            `/(admin)/community/${id}`
        );
    };

    /* =======================================================
       LOADING
    ======================================================= */

    if (loading && !refreshing) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-100">
                <ActivityIndicator
                    size="large"
                    color="#A8794A"
                />

                <Text className="mt-3 text-gray-500">
                    Loading communities...
                </Text>
            </View>
        );
    }

    /* =======================================================
       SCREEN
    ======================================================= */

    return (
        <ScrollView
            className="flex-1 bg-gray-100"
            contentContainerClassName="p-5 pb-10"
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            }
            showsVerticalScrollIndicator={false}
        >
            {/* =================================================
                HEADER
            ================================================= */}

            <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                    <Text className="text-2xl font-bold text-gray-900">
                        Community Pages
                    </Text>

                    <Text className="mt-1 text-gray-500">
                        Create, edit, and manage neighborhood pages.
                    </Text>
                </View>

                <Pressable
                    onPress={
                        handleNewCommunity
                    }
                    className="flex-row items-center rounded-xl bg-bronze px-4 py-3"
                >
                    <Ionicons
                        name="add"
                        size={20}
                        color="#ffffff"
                    />

                    <Text className="ml-1 font-bold text-white">
                        New
                    </Text>
                </Pressable>
            </View>

            {/* =================================================
                SELECT ALL
            ================================================= */}

            {data.length > 0 && (
                <Pressable
                    onPress={
                        handleSelectAll
                    }
                    className="mt-5 flex-row items-center rounded-xl bg-white p-4"
                >
                    <Ionicons
                        name={
                            selected.length ===
                            data.length
                                ? "checkbox"
                                : "square-outline"
                        }
                        size={23}
                        color="#A8794A"
                    />

                    <Text className="ml-3 font-semibold text-gray-800">
                        Select All
                    </Text>
                </Pressable>
            )}

            {/* =================================================
                COMMUNITY LIST
            ================================================= */}

            <View className="mt-5">
                {data.map((item) => {
                    const isSelected =
                        selected.includes(
                            item._id
                        );

                    return (
                        <View
                            key={item._id}
                            className={`mb-4 rounded-2xl border bg-white p-4 ${
                                isSelected
                                    ? "border-bronze"
                                    : "border-gray-100"
                            }`}
                        >
                            {/* =================================
                                TOP
                            ================================= */}

                            <View className="flex-row">
                                <Pressable
                                    onPress={() =>
                                        toggleSelect(
                                            item._id
                                        )
                                    }
                                    className="mr-3"
                                >
                                    <Ionicons
                                        name={
                                            isSelected
                                                ? "checkbox"
                                                : "square-outline"
                                        }
                                        size={24}
                                        color={
                                            isSelected
                                                ? "#A8794A"
                                                : "#9ca3af"
                                        }
                                    />
                                </Pressable>

                                <View className="flex-1">
                                    <Text className="text-lg font-bold text-gray-900">
                                        {
                                            item.community
                                        }
                                    </Text>

                                    <Text className="mt-1 text-sm text-gray-500">
                                        Slug:{" "}
                                        {
                                            item.slug
                                        }
                                    </Text>

                                    <Text className="mt-1 text-xs text-gray-400">
                                        Updated:{" "}
                                        {item.updatedAt
                                            ? new Date(
                                                  item.updatedAt
                                              ).toLocaleDateString()
                                            : "N/A"}
                                    </Text>
                                </View>
                            </View>

                            {/* =================================
                                ACTIONS
                            ================================= */}

                            <View className="mt-4 flex-row justify-end border-t border-gray-100 pt-3">
                                <Pressable
                                    onPress={() =>
                                        handleEditCommunity(
                                            item._id
                                        )
                                    }
                                    className="mr-3 rounded-lg bg-blue-50 p-3"
                                >
                                    <Ionicons
                                        name="create-outline"
                                        size={19}
                                        color="#2563eb"
                                    />
                                </Pressable>

                                <Pressable
                                    onPress={() =>
                                        handleDelete(
                                            item._id
                                        )
                                    }
                                    className="rounded-lg bg-red-50 p-3"
                                >
                                    <Ionicons
                                        name="trash-outline"
                                        size={19}
                                        color="#dc2626"
                                    />
                                </Pressable>
                            </View>
                        </View>
                    );
                })}

                {/* ===============================================
                    EMPTY
                =============================================== */}

                {data.length === 0 && (
                    <View className="items-center rounded-2xl bg-white p-10">
                        <Ionicons
                            name="business-outline"
                            size={40}
                            color="#9ca3af"
                        />

                        <Text className="mt-3 text-gray-400">
                            No community pages found.
                        </Text>
                    </View>
                )}
            </View>

            {/* =================================================
                SAVE BUTTON
            ================================================= */}

            <Pressable
                onPress={
                    handleSaveSelected
                }
                disabled={
                    selected.length === 0
                }
                className={`mt-4 items-center rounded-xl px-5 py-4 ${
                    selected.length === 0
                        ? "bg-gray-300"
                        : "bg-bronze"
                }`}
            >
                <View className="flex-row items-center">
                    <Ionicons
                        name="save-outline"
                        size={19}
                        color="#ffffff"
                    />

                    <Text className="ml-2 font-bold text-white">
                        Save{" "}
                        {selected.length}{" "}
                        Selected
                    </Text>
                </View>
            </Pressable>
        </ScrollView>
    );
}