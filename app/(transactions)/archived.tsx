import React, {
    useCallback,
    useEffect,
    useState,
} from "react";

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
    ArchiveRestore,
    ArrowLeft,
    CalendarDays,
    MapPin,
    RotateCcw,
} from "lucide-react-native";

import { useRouter } from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuth } from "../../contexts/AuthContext";

/* =========================================================
   CONSTANTS
========================================================= */

const API_URL = "https://realtorparth.ca";

const CURRENT_TRANSACTION_KEY =
    "currentTransactionId";

/* =========================================================
   TYPES
========================================================= */

interface TransactionUser {
    id?: string;
    _id?: string;
    userId?: string;
    name?: string;
    email?: string;
    role?: string;
    isSuperAdmin?: boolean;
}

interface Transaction {
    id: string;
    name: string;
    property: string;
    status: string;
    createdAt: string;
}

/* =========================================================
   HELPER
========================================================= */

const getTransactionUserId = (
    transactionUser: TransactionUser | null
): string | null => {
    if (!transactionUser) {
        return null;
    }

    /*
     * The website uses:
     *
     * transactionUser.id
     */

    if (
        typeof transactionUser.id ===
            "string" &&
        transactionUser.id.trim()
    ) {
        return transactionUser.id;
    }

    /*
     * Fallbacks in case the backend returns
     * another ID property.
     */

    if (
        typeof transactionUser._id ===
            "string" &&
        transactionUser._id.trim()
    ) {
        return transactionUser._id;
    }

    if (
        typeof transactionUser.userId ===
            "string" &&
        transactionUser.userId.trim()
    ) {
        return transactionUser.userId;
    }

    return null;
};

/* =========================================================
   FORMAT DATE
========================================================= */

const formatDate = (
    dateValue: string
): string => {
    if (!dateValue) {
        return "";
    }

    const date =
        new Date(dateValue);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return dateValue;
    }

    return date
        .toISOString()
        .split("T")[0];
};

/* =========================================================
   COMPONENT
========================================================= */

export default function ArchivedTransactions() {
    const router = useRouter();

    const {
        user,
        loading: authLoading,
    } = useAuth();

    /* =====================================================
       STATE
    ===================================================== */

    const [
        transactionUser,
        setTransactionUser,
    ] = useState<TransactionUser | null>(
        null
    );

    const [
        transactions,
        setTransactions,
    ] = useState<Transaction[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        refreshing,
        setRefreshing,
    ] = useState(false);

    const [
        restoringId,
        setRestoringId,
    ] = useState<string | null>(
        null
    );

    const [
        checkingSession,
        setCheckingSession,
    ] = useState(true);

    const [
        errorMessage,
        setErrorMessage,
    ] = useState<string | null>(
        null
    );

    /* =====================================================
       RESOLVE TRANSACTION USER
       
       IMPORTANT:
       
       We use the currently logged-in Admin email.
       
       This is the same account that entered the
       Admin Panel.
    ===================================================== */

    const resolveTransactionUser =
        useCallback(async () => {
            if (authLoading) {
                return null;
            }

            if (!user?.email) {
                setTransactionUser(null);
                setCheckingSession(false);

                return null;
            }

            const controller =
                new AbortController();

            const timeout =
                setTimeout(() => {
                    controller.abort();
                }, 10000);

            try {
                setCheckingSession(true);

                const url =
                    `${API_URL}/api/transactions/check-super-admin/${encodeURIComponent(
                        user.email
                    )}`;

                console.log(
                    "Checking Transaction access:",
                    url
                );

                const response =
                    await fetch(url, {
                        method: "GET",

                        headers: {
                            Accept:
                                "application/json",
                        },

                        signal:
                            controller.signal,
                    });

                let data: any;

                try {
                    data =
                        await response.json();
                } catch {
                    throw new Error(
                        "Invalid server response"
                    );
                }

                console.log(
                    "Transaction access response:",
                    data
                );

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                        `Error ${response.status}`
                    );
                }

                if (!data?.success) {
                    throw new Error(
                        data?.message ||
                        "Transaction access could not be verified."
                    );
                }

                if (
                    !data?.isSuperAdmin
                ) {
                    throw new Error(
                        "This admin account does not have Transaction Panel access."
                    );
                }

                /*
                 * Support common backend response
                 * structures.
                 */

                const resolvedUser =
                    data?.user ||
                    data?.transactionUser ||
                    data?.admin ||
                    data;

                const resolvedId =
                    resolvedUser?.id ||
                    resolvedUser?._id ||
                    resolvedUser?.userId;

                if (!resolvedId) {
                    console.error(
                        "Transaction user ID missing:",
                        data
                    );

                    throw new Error(
                        "Transaction user ID was not returned by the server."
                    );
                }

                const normalizedUser:
                    TransactionUser = {
                    ...resolvedUser,

                    id: String(
                        resolvedId
                    ),
                };

                setTransactionUser(
                    normalizedUser
                );

                setErrorMessage(
                    null
                );

                return normalizedUser;
            } catch (
                error: any
            ) {
                console.error(
                    "Resolve Transaction User Error:",
                    error
                );

                setTransactionUser(
                    null
                );

                if (
                    error?.name ===
                    "AbortError"
                ) {
                    setErrorMessage(
                        "Transaction access request timed out."
                    );
                } else if (
                    error?.name ===
                    "TypeError"
                ) {
                    setErrorMessage(
                        "Network error. Please check your internet connection."
                    );
                } else {
                    setErrorMessage(
                        error?.message ||
                        "Unable to verify Transaction Panel access."
                    );
                }

                return null;
            } finally {
                clearTimeout(timeout);

                setCheckingSession(
                    false
                );
            }
        }, [
            authLoading,
            user?.email,
        ]);

    /* =====================================================
       FETCH ARCHIVED TRANSACTIONS
    ===================================================== */

    const fetchArchivedTransactions =
        useCallback(
            async (
                showLoader = true
            ) => {
                const userId =
                    getTransactionUserId(
                        transactionUser
                    );

                if (!userId) {
                    setLoading(false);
                    return;
                }

                if (showLoader) {
                    setLoading(true);
                }

                setErrorMessage(null);

                const controller =
                    new AbortController();

                const timeout =
                    setTimeout(() => {
                        controller.abort();
                    }, 10000);

                try {
                    const url =
                        `${API_URL}/api/transactions/archived/${encodeURIComponent(
                            userId
                        )}`;

                    console.log(
                        "Fetching archived transactions:",
                        url
                    );

                    const response =
                        await fetch(url, {
                            method: "GET",

                            headers: {
                                Accept:
                                    "application/json",
                            },

                            signal:
                                controller.signal,
                        });

                    let data: any;

                    try {
                        data =
                            await response.json();
                    } catch {
                        throw new Error(
                            "Invalid server response"
                        );
                    }

                    if (!response.ok) {
                        throw new Error(
                            data?.message ||
                            `Error ${response.status}`
                        );
                    }

                    if (!data?.success) {
                        throw new Error(
                            data?.message ||
                            "Failed to fetch archived transactions"
                        );
                    }

                    const mapped:
                        Transaction[] =
                        Array.isArray(
                            data.transactions
                        )
                            ? data.transactions.map(
                                (tx: any) => ({
                                    id: String(
                                        tx?._id ??
                                        tx?.id ??
                                        ""
                                    ),

                                    name:
                                        tx?.name ||
                                        "Unnamed Transaction",

                                    property:
                                        tx?.propertyAddress ||
                                        "No property address",

                                    status:
                                        tx?.status ||
                                        "Archived",

                                    createdAt:
                                        formatDate(
                                            tx?.createdAt
                                        ),
                                })
                            )
                            : [];

                    setTransactions(
                        mapped
                    );
                } catch (
                    error: any
                ) {
                    console.error(
                        "Fetch archived transactions error:",
                        error
                    );

                    if (
                        error?.name ===
                        "AbortError"
                    ) {
                        setErrorMessage(
                            "The server took too long to respond."
                        );
                    } else if (
                        error?.name ===
                        "TypeError"
                    ) {
                        setErrorMessage(
                            "Server is down or there was a network error."
                        );
                    } else {
                        setErrorMessage(
                            error?.message ||
                            "Failed to load archived transactions."
                        );
                    }
                } finally {
                    clearTimeout(timeout);

                    setLoading(false);
                    setRefreshing(false);
                }
            },
            [
                transactionUser,
            ]
        );

    /* =====================================================
       INITIAL SESSION RESOLUTION
    ===================================================== */

    useEffect(() => {
        if (!authLoading) {
            resolveTransactionUser();
        }
    }, [
        authLoading,
        resolveTransactionUser,
    ]);

    /* =====================================================
       FETCH AFTER USER RESOLUTION
    ===================================================== */

    useEffect(() => {
        if (
            !checkingSession &&
            transactionUser
        ) {
            fetchArchivedTransactions();
        }
    }, [
        checkingSession,
        transactionUser,
        fetchArchivedTransactions,
    ]);

    /* =====================================================
       REFRESH
    ===================================================== */

    const handleRefresh =
        useCallback(async () => {
            setRefreshing(true);

            const resolvedUser =
                await resolveTransactionUser();

            if (!resolvedUser) {
                setRefreshing(false);
                return;
            }

            const userId =
                getTransactionUserId(
                    resolvedUser
                );

            if (!userId) {
                setRefreshing(false);
                return;
            }

            const controller =
                new AbortController();

            const timeout =
                setTimeout(() => {
                    controller.abort();
                }, 10000);

            try {
                const response =
                    await fetch(
                        `${API_URL}/api/transactions/archived/${encodeURIComponent(
                            userId
                        )}`,
                        {
                            method: "GET",

                            headers: {
                                Accept:
                                    "application/json",
                            },

                            signal:
                                controller.signal,
                        }
                    );

                let data: any;

                try {
                    data =
                        await response.json();
                } catch {
                    throw new Error(
                        "Invalid server response"
                    );
                }

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                        `Error ${response.status}`
                    );
                }

                if (!data?.success) {
                    throw new Error(
                        data?.message ||
                        "Failed to refresh archived transactions"
                    );
                }

                const mapped:
                    Transaction[] =
                    Array.isArray(
                        data.transactions
                    )
                        ? data.transactions.map(
                            (tx: any) => ({
                                id: String(
                                    tx?._id ??
                                    tx?.id ??
                                    ""
                                ),

                                name:
                                    tx?.name ||
                                    "Unnamed Transaction",

                                property:
                                    tx?.propertyAddress ||
                                    "No property address",

                                status:
                                    tx?.status ||
                                    "Archived",

                                createdAt:
                                    formatDate(
                                        tx?.createdAt
                                    ),
                            })
                        )
                        : [];

                setTransactions(
                    mapped
                );

                setErrorMessage(
                    null
                );
            } catch (
                error: any
            ) {
                console.error(
                    "Refresh archived transactions error:",
                    error
                );

                if (
                    error?.name ===
                    "AbortError"
                ) {
                    setErrorMessage(
                        "The server took too long to respond."
                    );
                } else if (
                    error?.name ===
                    "TypeError"
                ) {
                    setErrorMessage(
                        "Server is down or there was a network error."
                    );
                } else {
                    setErrorMessage(
                        error?.message ||
                        "Failed to refresh archived transactions."
                    );
                }
            } finally {
                clearTimeout(timeout);

                setRefreshing(false);
            }
        }, [
            resolveTransactionUser,
        ]);

    /* =====================================================
       RESTORE TRANSACTION
    ===================================================== */

    const restoreTransaction =
        async (
            id: string
        ) => {
            const userId =
                getTransactionUserId(
                    transactionUser
                );

            if (!userId) {
                Alert.alert(
                    "User Not Found",
                    "Transaction user could not be found."
                );

                return;
            }

            setRestoringId(id);

            const controller =
                new AbortController();

            const timeout =
                setTimeout(() => {
                    controller.abort();
                }, 10000);

            try {
                const response =
                    await fetch(
                        `${API_URL}/api/transactions/restore/${encodeURIComponent(
                            id
                        )}`,
                        {
                            method: "PUT",

                            headers: {
                                Accept:
                                    "application/json",

                                "Content-Type":
                                    "application/json",
                            },

                            body:
                                JSON.stringify({
                                    userId,
                                }),

                            signal:
                                controller.signal,
                        }
                    );

                let data: any;

                try {
                    data =
                        await response.json();
                } catch {
                    throw new Error(
                        "Invalid server response"
                    );
                }

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                        `Error ${response.status}`
                    );
                }

                if (!data?.success) {
                    throw new Error(
                        data?.message ||
                        "Failed to restore transaction"
                    );
                }

                /*
                 * Same behavior as website:
                 * immediately remove from archived list.
                 */

                setTransactions(
                    previous =>
                        previous.filter(
                            transaction =>
                                transaction.id !==
                                id
                        )
                );

                /*
                 * Clear current transaction if
                 * it happens to be this transaction.
                 */

                const currentTransactionId =
                    await AsyncStorage.getItem(
                        CURRENT_TRANSACTION_KEY
                    );

                if (
                    currentTransactionId ===
                    id
                ) {
                    await AsyncStorage.removeItem(
                        CURRENT_TRANSACTION_KEY
                    );
                }

                Alert.alert(
                    "Success",
                    "Transaction restored successfully."
                );
            } catch (
                error: any
            ) {
                console.error(
                    "Restore transaction error:",
                    error
                );

                if (
                    error?.name ===
                    "AbortError"
                ) {
                    Alert.alert(
                        "Request Timed Out",
                        "The server took too long to respond."
                    );
                } else if (
                    error?.name ===
                    "TypeError"
                ) {
                    Alert.alert(
                        "Server Error",
                        "Server is down or there was a network error."
                    );
                } else {
                    Alert.alert(
                        "Error",
                        error?.message ||
                        "Server error"
                    );
                }
            } finally {
                clearTimeout(timeout);

                setRestoringId(null);
            }
        };

    /* =====================================================
       CONFIRM RESTORE
    ===================================================== */

    const confirmRestore =
        (
            transaction: Transaction
        ) => {
            Alert.alert(
                "Restore Transaction",
                `Are you sure you want to restore "${transaction.name}"?`,
                [
                    {
                        text: "Cancel",
                        style: "cancel",
                    },

                    {
                        text: "Restore",

                        onPress: () =>
                            restoreTransaction(
                                transaction.id
                            ),
                    },
                ]
            );
        };

    /* =====================================================
       AUTH LOADING
    ===================================================== */

    if (authLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator
                    size="large"
                    color="#9a6a3a"
                />

                <Text className="mt-4 text-sm text-gray-500">
                    Checking admin session...
                </Text>
            </View>
        );
    }

    /* =====================================================
       TRANSACTION SESSION CHECKING
    ===================================================== */

    if (checkingSession) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator
                    size="large"
                    color="#9a6a3a"
                />

                <Text className="mt-4 text-sm text-gray-500">
                    Checking Transaction Panel access...
                </Text>
            </View>
        );
    }

    /* =====================================================
       NO TRANSACTION ACCESS
    ===================================================== */

    if (!transactionUser) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50 px-6">
                <View className="w-full max-w-[380px] items-center rounded-3xl border border-gray-200 bg-white px-6 py-10">
                    <Text className="text-xl font-semibold text-gray-800">
                        Transaction Access Required
                    </Text>

                    <Text className="mt-2 text-center text-sm leading-5 text-gray-500">
                        {errorMessage ||
                            "Your Admin account does not have access to the Transaction Panel."}
                    </Text>

                    <Pressable
                        onPress={() =>
                            router.replace(
                                "/(transactions)" as any
                            )
                        }
                        className="mt-6 rounded-xl bg-[#9a6a3a] px-6 py-3"
                    >
                        <Text className="font-semibold text-white">
                            Back to Transactions
                        </Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    /* =====================================================
       LOADING
    ===================================================== */

    if (
        loading &&
        !refreshing
    ) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator
                    size="large"
                    color="#9a6a3a"
                />

                <Text className="mt-4 text-sm text-gray-500">
                    Loading archived transactions...
                </Text>
            </View>
        );
    }

    /* =====================================================
       MAIN UI
    ===================================================== */

    return (
        <View className="flex-1 bg-gray-50">
            <ScrollView
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
                        tintColor="#9a6a3a"
                    />
                }
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingTop: 20,
                    paddingBottom: 40,
                }}
            >
                {/* =================================================
                    HEADER
                ================================================= */}

                <View className="mb-6">
                    <View className="flex-row items-center">
                        {/* <Pressable
                            onPress={() =>
                                router.replace(
                                    "/(transactions)" as any
                                )
                            }
                            className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-white"
                            style={({
                                pressed,
                            }) => ({
                                opacity:
                                    pressed
                                        ? 0.7
                                        : 1,
                            })}
                        >
                            <ArrowLeft
                                size={21}
                                color="#374151"
                            />
                        </Pressable> */}

                        <View className="flex-1">
                            <Text className="text-2xl font-bold text-gray-800">
                                Archived Transactions
                            </Text>

                            <Text className="mt-1 text-sm text-gray-500">
                                Previously archived real estate transactions.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* =================================================
                    ERROR
                ================================================= */}

                {errorMessage && (
                    <View className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                        <Text className="font-semibold text-red-700">
                            Unable to load archived transactions
                        </Text>

                        <Text className="mt-1 text-sm leading-5 text-red-600">
                            {errorMessage}
                        </Text>

                        <Pressable
                            onPress={() =>
                                fetchArchivedTransactions()
                            }
                            className="mt-3 self-start rounded-lg bg-red-500 px-4 py-2.5"
                        >
                            <Text className="text-sm font-semibold text-white">
                                Try Again
                            </Text>
                        </Pressable>
                    </View>
                )}

                {/* =================================================
                    MAIN CARD
                ================================================= */}

                <View className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
                    {transactions.length ===
                    0 ? (
                        /* EMPTY STATE */

                        <View className="items-center px-6 py-20">
                            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                                <ArchiveRestore
                                    size={30}
                                    color="#9ca3af"
                                />
                            </View>

                            <Text className="text-lg font-semibold text-gray-700">
                                No archived transactions
                            </Text>

                            <Text className="mt-2 max-w-xs text-center text-sm leading-5 text-gray-400">
                                Archived transactions will appear here.
                            </Text>

                            <Pressable
                                onPress={() =>
                                    router.replace(
                                        "/(transactions)" as any
                                    )
                                }
                                className="mt-6 rounded-xl bg-[#9a6a3a] px-5 py-3"
                                style={({
                                    pressed,
                                }) => ({
                                    opacity:
                                        pressed
                                            ? 0.85
                                            : 1,
                                })}
                            >
                                <Text className="text-sm font-semibold text-white">
                                    Back to Transactions
                                </Text>
                            </Pressable>
                        </View>
                    ) : (
                        /* TRANSACTION CARDS */

                        <View>
                            {transactions.map(
                                (
                                    transaction,
                                    index
                                ) => {
                                    const isRestoring =
                                        restoringId ===
                                        transaction.id;

                                    return (
                                        <View
                                            key={
                                                transaction.id
                                            }
                                            className={`p-5 ${
                                                index !==
                                                transactions.length -
                                                    1
                                                    ? "border-b border-gray-100"
                                                    : ""
                                            }`}
                                        >
                                            {/* TOP */}

                                            <View className="flex-row items-start justify-between">
                                                <View className="mr-3 flex-1">
                                                    <Text
                                                        numberOfLines={
                                                            2
                                                        }
                                                        className="text-base font-semibold text-gray-800"
                                                    >
                                                        {
                                                            transaction.name
                                                        }
                                                    </Text>

                                                    <View className="mt-2 flex-row items-start">
                                                        <MapPin
                                                            size={
                                                                16
                                                            }
                                                            color="#9ca3af"
                                                            style={{
                                                                marginTop:
                                                                    2,
                                                                marginRight:
                                                                    6,
                                                            }}
                                                        />

                                                        <Text
                                                            numberOfLines={
                                                                3
                                                            }
                                                            className="flex-1 text-sm leading-5 text-gray-500"
                                                        >
                                                            {
                                                                transaction.property
                                                            }
                                                        </Text>
                                                    </View>
                                                </View>

                                                {/* ARCHIVED BADGE */}

                                                <View className="rounded-full bg-gray-200 px-3 py-1.5">
                                                    <Text className="text-xs font-semibold text-gray-700">
                                                        Archived
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* DATE */}

                                            <View className="mt-4 flex-row items-center">
                                                <CalendarDays
                                                    size={
                                                        16
                                                    }
                                                    color="#9ca3af"
                                                />

                                                <Text className="ml-2 text-sm text-gray-500">
                                                    Created:{" "}
                                                    {
                                                        transaction.createdAt
                                                    }
                                                </Text>
                                            </View>

                                            {/* RESTORE */}

                                            <Pressable
                                                onPress={() =>
                                                    confirmRestore(
                                                        transaction
                                                    )
                                                }
                                                disabled={
                                                    isRestoring
                                                }
                                                className="mt-5 h-12 flex-row items-center justify-center rounded-xl bg-green-600"
                                                style={({
                                                    pressed,
                                                }) => ({
                                                    opacity:
                                                        isRestoring
                                                            ? 0.6
                                                            : pressed
                                                                ? 0.85
                                                                : 1,
                                                })}
                                            >
                                                {isRestoring ? (
                                                    <ActivityIndicator
                                                        size="small"
                                                        color="#ffffff"
                                                    />
                                                ) : (
                                                    <RotateCcw
                                                        size={
                                                            17
                                                        }
                                                        color="#ffffff"
                                                    />
                                                )}

                                                <Text className="ml-2 text-sm font-semibold text-white">
                                                    {isRestoring
                                                        ? "Restoring..."
                                                        : "Restore Transaction"}
                                                </Text>
                                            </Pressable>
                                        </View>
                                    );
                                }
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}