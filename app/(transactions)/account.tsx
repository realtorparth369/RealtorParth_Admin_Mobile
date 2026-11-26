import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useAuth } from "../../contexts/AuthContext";

const API_BASE = "https://realtorparth.ca/api";

interface TransactionUser {
    id?: string;
    _id?: string;
    userId?: string;
    name?: string;
    email?: string;
    role?: string;
    isSuperAdmin?: boolean;
}

interface AccountForm {
    brokerageName: string;
    brokerageStreetNum: string;
    brokerageStreet: string;
    brokerageCity: string;
    brokerageState: string;
    brokeragePostalCode: string;
    brokeragePhone: string;
    brokerageEmail: string;

    repName: string;
    repPhone: string;
    repEmail: string;
}

const INITIAL_FORM: AccountForm = {
    brokerageName: "",
    brokerageStreetNum: "",
    brokerageStreet: "",
    brokerageCity: "",
    brokerageState: "",
    brokeragePostalCode: "",
    brokeragePhone: "",
    brokerageEmail: "",

    repName: "",
    repPhone: "",
    repEmail: "",
};

const getTransactionUserId = (
    transactionUser: TransactionUser | null
): string | null => {
    if (!transactionUser) {
        return null;
    }

    if (
        typeof transactionUser.id === "string" &&
        transactionUser.id.trim()
    ) {
        return transactionUser.id;
    }

    if (
        typeof transactionUser._id === "string" &&
        transactionUser._id.trim()
    ) {
        return transactionUser._id;
    }

    if (
        typeof transactionUser.userId === "string" &&
        transactionUser.userId.trim()
    ) {
        return transactionUser.userId;
    }

    return null;
};

export default function AdminAccount() {
    const router = useRouter();

    const { user } = useAuth();

    const [checkingAuth, setCheckingAuth] =
        useState(true);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [transactionUserId, setTransactionUserId] =
        useState<string | null>(null);

    const [form, setForm] =
        useState<AccountForm>(INITIAL_FORM);

    // ============================================================
    // RESOLVE TRANSACTION USER FROM ADMIN EMAIL
    // ============================================================

    useEffect(() => {
        const resolveTransactionUser =
            async () => {
                try {
                    if (!user?.email) {
                        setCheckingAuth(false);
                        setLoading(false);

                        Alert.alert(
                            "Authentication Error",
                            "Admin account information was not found.",
                            [
                                {
                                    text: "OK",
                                    onPress: () =>
                                        router.replace(
                                            "/login" as any
                                        ),
                                },
                            ]
                        );

                        return;
                    }

                    const controller =
                        new AbortController();

                    const timeout =
                        setTimeout(() => {
                            controller.abort();
                        }, 10000);

                    const res = await fetch(
                        `${API_BASE}/transactions/check-super-admin/${encodeURIComponent(
                            user.email
                        )}`,
                        {
                            signal: controller.signal,
                        }
                    );

                    clearTimeout(timeout);

                    let data: any;

                    try {
                        data = await res.json();
                    } catch {
                        throw new Error(
                            "Invalid server response"
                        );
                    }

                    if (!res.ok) {
                        throw new Error(
                            data?.message ||
                                `Error ${res.status}`
                        );
                    }

                    if (
                        !data?.success ||
                        !data?.isSuperAdmin
                    ) {
                        throw new Error(
                            "Transaction account access was not found."
                        );
                    }

                    const transactionUser =
                        (data?.user ||
                            data?.transactionUser ||
                            data?.admin ||
                            data) as TransactionUser;

                    const id =
                        getTransactionUserId(
                            transactionUser
                        );

                    if (!id) {
                        throw new Error(
                            "Transaction user ID was not found."
                        );
                    }

                    setTransactionUserId(id);
                    setCheckingAuth(false);
                } catch (error: any) {
                    console.error(
                        "TRANSACTION AUTH ERROR:",
                        error
                    );

                    setCheckingAuth(false);
                    setLoading(false);

                    if (
                        error?.name ===
                        "AbortError"
                    ) {
                        Alert.alert(
                            "Timeout",
                            "Authentication request timed out."
                        );
                    } else if (
                        error?.name ===
                        "TypeError"
                    ) {
                        Alert.alert(
                            "Network Error",
                            "Server down or network error."
                        );
                    } else {
                        Alert.alert(
                            "Authentication Error",
                            error?.message ||
                                "Unable to access transaction account."
                        );
                    }
                }
            };

        resolveTransactionUser();
    }, [user?.email]);

    // ============================================================
    // LOAD SETTINGS
    // ============================================================

    useEffect(() => {
        if (checkingAuth) {
            return;
        }

        if (!transactionUserId) {
            return;
        }

        const fetchSettings = async () => {
            try {
                setLoading(true);

                const controller =
                    new AbortController();

                const timeout =
                    setTimeout(() => {
                        controller.abort();
                    }, 10000);

                const res = await fetch(
                    `${API_BASE}/admin/settings/${encodeURIComponent(
                        transactionUserId
                    )}`,
                    {
                        signal: controller.signal,
                    }
                );

                clearTimeout(timeout);

                let data: any;

                try {
                    data = await res.json();
                } catch {
                    throw new Error(
                        "Invalid server response"
                    );
                }

                if (!res.ok) {
                    throw new Error(
                        data?.message ||
                            `Error ${res.status}`
                    );
                }

                if (data?.data) {
                    const settings =
                        data.data;

                    setForm({
                        brokerageName:
                            settings?.brokerageName ||
                            "",

                        brokerageStreetNum:
                            settings?.brokerageStreetNum ||
                            "",

                        brokerageStreet:
                            settings?.brokerageStreet ||
                            "",

                        brokerageCity:
                            settings?.brokerageCity ||
                            "",

                        brokerageState:
                            settings?.brokerageState ||
                            "",

                        brokeragePostalCode:
                            settings?.brokeragePostalCode ||
                            "",

                        brokeragePhone:
                            settings?.brokeragePhone ||
                            "",

                        brokerageEmail:
                            settings?.brokerageEmail ||
                            "",

                        repName:
                            settings?.repName ||
                            "",

                        repPhone:
                            settings?.repPhone ||
                            "",

                        repEmail:
                            settings?.repEmail ||
                            "",
                    });
                }
            } catch (error: any) {
                console.error(
                    "Fetch Settings Error:",
                    error
                );

                if (
                    error?.name ===
                    "AbortError"
                ) {
                    Alert.alert(
                        "Timeout",
                        "The request timed out. Please try again."
                    );
                } else if (
                    error?.name ===
                    "TypeError"
                ) {
                    Alert.alert(
                        "Network Error",
                        "Network error."
                    );
                } else {
                    Alert.alert(
                        "Error",
                        error?.message ||
                            "Failed to load settings."
                    );
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [
        checkingAuth,
        transactionUserId,
    ]);

    // ============================================================
    // HANDLE CHANGE
    // ============================================================

    const handleChange = (
        field: keyof AccountForm,
        value: string
    ) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // ============================================================
    // SAVE SETTINGS
    // ============================================================

    const handleSave = async () => {
        if (!transactionUserId) {
            Alert.alert(
                "Authentication Error",
                "Transaction user was not found."
            );

            return;
        }

        // ========================================================
        // VALIDATION
        // ========================================================

        if (
            !form.brokerageName.trim() ||
            !form.repName.trim()
        ) {
            Alert.alert(
                "Required Fields",
                "Brokerage name and representative name are required."
            );

            return;
        }

        try {
            setSaving(true);

            const controller =
                new AbortController();

            const timeout =
                setTimeout(() => {
                    controller.abort();
                }, 10000);

            const res = await fetch(
                `${API_BASE}/admin/settings/save`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        userId:
                            transactionUserId,
                        ...form,
                    }),

                    signal: controller.signal,
                }
            );

            clearTimeout(timeout);

            let data: any;

            try {
                data = await res.json();
            } catch {
                throw new Error(
                    "Invalid server response"
                );
            }

            if (!res.ok) {
                throw new Error(
                    data?.message ||
                        `Error ${res.status}`
                );
            }

            if (!data?.success) {
                throw new Error(
                    data?.message ||
                        "Failed to save settings."
                );
            }

            Alert.alert(
                "Success",
                "Settings saved successfully."
            );
        } catch (error: any) {
            console.error(
                "Save Settings Error:",
                error
            );

            if (
                error?.name ===
                "AbortError"
            ) {
                Alert.alert(
                    "Timeout",
                    "The request timed out. Please try again."
                );
            } else if (
                error?.name ===
                "TypeError"
            ) {
                Alert.alert(
                    "Network Error",
                    "Network error."
                );
            } else {
                Alert.alert(
                    "Error",
                    error?.message ||
                        "Something went wrong."
                );
            }
        } finally {
            setSaving(false);
        }
    };

    // ============================================================
    // AUTH LOADING
    // ============================================================

    if (checkingAuth) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator
                    size="large"
                    color="#B8860B"
                />

                <Text className="mt-3 text-sm text-gray-500">
                    Checking authentication...
                </Text>
            </View>
        );
    }

    // ============================================================
    // PAGE
    // ============================================================

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-gray-50"
            behavior={
                Platform.OS === "ios"
                    ? "padding"
                    : undefined
            }
        >
            {/* ==================================================
                HEADER
            ================================================== */}

            <View className="border-b border-gray-200 bg-white px-4 py-4">
                <View className="flex-row items-center">
                    {/* <Pressable
                        onPress={() =>
                            router.replace(
                                "/(transactions)" as any
                            )
                        }
                        className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-gray-100 active:bg-gray-200"
                    >
                        <Ionicons
                            name="arrow-back"
                            size={21}
                            color="#374151"
                        />
                    </Pressable> */}

                    <View className="flex-1">
                        <Text className="text-lg font-semibold text-gray-800">
                            Admin Account Settings
                        </Text>

                        <Text className="mt-0.5 text-xs text-gray-500">
                            Manage brokerage and representative
                            details
                        </Text>
                    </View>
                </View>
            </View>

            {/* ==================================================
                CONTENT
            ================================================== */}

            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    padding: 16,
                    paddingBottom: 50,
                }}
                keyboardShouldPersistTaps="handled"
            >
                {loading ? (
                    <View className="items-center justify-center py-16">
                        <ActivityIndicator
                            size="large"
                            color="#B8860B"
                        />

                        <Text className="mt-3 text-sm text-gray-500">
                            Loading...
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* ==========================================
                            BROKERAGE INFORMATION
                        ========================================== */}

                        <View className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
                            <View className="mb-5 flex-row items-center">
                                <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#B8860B]/10">
                                    <Ionicons
                                        name="business-outline"
                                        size={21}
                                        color="#B8860B"
                                    />
                                </View>

                                <View className="ml-3">
                                    <Text className="text-lg font-semibold text-gray-800">
                                        Brokerage Information
                                    </Text>

                                    <Text className="mt-0.5 text-xs text-gray-500">
                                        Brokerage contact and address
                                    </Text>
                                </View>
                            </View>

                            {/* Brokerage Name */}

                            <View className="mb-4">
                                <Text className="mb-1.5 text-sm font-medium text-gray-700">
                                    Brokerage Name
                                </Text>

                                <TextInput
                                    value={
                                        form.brokerageName
                                    }
                                    onChangeText={(
                                        value
                                    ) =>
                                        handleChange(
                                            "brokerageName",
                                            value
                                        )
                                    }
                                    placeholder="Brokerage Name"
                                    placeholderTextColor="#9ca3af"
                                    className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800"
                                />
                            </View>

                            {/* Phone */}

                            <View className="mb-4">
                                <Text className="mb-1.5 text-sm font-medium text-gray-700">
                                    Phone
                                </Text>

                                <TextInput
                                    value={
                                        form.brokeragePhone
                                    }
                                    onChangeText={(
                                        value
                                    ) =>
                                        handleChange(
                                            "brokeragePhone",
                                            value
                                        )
                                    }
                                    placeholder="Phone"
                                    placeholderTextColor="#9ca3af"
                                    keyboardType="phone-pad"
                                    className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800"
                                />
                            </View>

                            {/* Email */}

                            <View className="mb-4">
                                <Text className="mb-1.5 text-sm font-medium text-gray-700">
                                    Email
                                </Text>

                                <TextInput
                                    value={
                                        form.brokerageEmail
                                    }
                                    onChangeText={(
                                        value
                                    ) =>
                                        handleChange(
                                            "brokerageEmail",
                                            value
                                        )
                                    }
                                    placeholder="Email"
                                    placeholderTextColor="#9ca3af"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800"
                                />
                            </View>

                            {/* Street Number */}

                            <View className="mb-4">
                                <View className="mb-1.5 flex-row justify-between">
                                    <Text className="text-sm font-medium text-gray-700">
                                        Street Number
                                    </Text>

                                    <Text className="text-xs text-gray-400">
                                        {
                                            form
                                                .brokerageStreetNum
                                                .length
                                        }
                                        /10
                                    </Text>
                                </View>

                                <TextInput
                                    value={
                                        form.brokerageStreetNum
                                    }
                                    onChangeText={(
                                        value
                                    ) => {
                                        const clean =
                                            value
                                                .replace(
                                                    /\D/g,
                                                    ""
                                                )
                                                .slice(
                                                    0,
                                                    10
                                                );

                                        handleChange(
                                            "brokerageStreetNum",
                                            clean
                                        );
                                    }}
                                    placeholder="Street Number"
                                    placeholderTextColor="#9ca3af"
                                    keyboardType="number-pad"
                                    className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800"
                                />
                            </View>

                            {/* Street */}

                            <View className="mb-4">
                                <Text className="mb-1.5 text-sm font-medium text-gray-700">
                                    Street
                                </Text>

                                <TextInput
                                    value={
                                        form.brokerageStreet
                                    }
                                    onChangeText={(
                                        value
                                    ) =>
                                        handleChange(
                                            "brokerageStreet",
                                            value
                                        )
                                    }
                                    placeholder="Street"
                                    placeholderTextColor="#9ca3af"
                                    className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800"
                                />
                            </View>

                            {/* City */}

                            <View className="mb-4">
                                <Text className="mb-1.5 text-sm font-medium text-gray-700">
                                    City
                                </Text>

                                <TextInput
                                    value={
                                        form.brokerageCity
                                    }
                                    onChangeText={(
                                        value
                                    ) =>
                                        handleChange(
                                            "brokerageCity",
                                            value
                                        )
                                    }
                                    placeholder="City"
                                    placeholderTextColor="#9ca3af"
                                    className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800"
                                />
                            </View>

                            {/* State */}

                            <View className="mb-4">
                                <View className="mb-1.5 flex-row justify-between">
                                    <Text className="text-sm font-medium text-gray-700">
                                        State
                                    </Text>

                                    <Text className="text-xs text-gray-400">
                                        {
                                            form
                                                .brokerageState
                                                .length
                                        }
                                        /2
                                    </Text>
                                </View>

                                <TextInput
                                    value={
                                        form.brokerageState
                                    }
                                    onChangeText={(
                                        value
                                    ) => {
                                        const clean =
                                            value
                                                .replace(
                                                    /[^a-zA-Z]/g,
                                                    ""
                                                )
                                                .slice(
                                                    0,
                                                    2
                                                )
                                                .toUpperCase();

                                        handleChange(
                                            "brokerageState",
                                            clean
                                        );
                                    }}
                                    placeholder="State"
                                    placeholderTextColor="#9ca3af"
                                    autoCapitalize="characters"
                                    className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800"
                                />
                            </View>

                            {/* Postal Code */}

                            <View>
                                <Text className="mb-1.5 text-sm font-medium text-gray-700">
                                    Postal Code
                                </Text>

                                <TextInput
                                    value={
                                        form.brokeragePostalCode
                                    }
                                    onChangeText={(
                                        value
                                    ) =>
                                        handleChange(
                                            "brokeragePostalCode",
                                            value
                                        )
                                    }
                                    placeholder="Postal Code"
                                    placeholderTextColor="#9ca3af"
                                    autoCapitalize="characters"
                                    className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800"
                                />
                            </View>
                        </View>

                        {/* ==========================================
                            REPRESENTATIVE
                        ========================================== */}

                        <View className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
                            <View className="mb-5 flex-row items-center">
                                <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#B8860B]/10">
                                    <Ionicons
                                        name="person-outline"
                                        size={21}
                                        color="#B8860B"
                                    />
                                </View>

                                <View className="ml-3">
                                    <Text className="text-lg font-semibold text-gray-800">
                                        Brokerage Representative
                                    </Text>

                                    <Text className="mt-0.5 text-xs text-gray-500">
                                        Representative contact details
                                    </Text>
                                </View>
                            </View>

                            {/* Name */}

                            <View className="mb-4">
                                <View className="mb-1.5 flex-row justify-between">
                                    <Text className="text-sm font-medium text-gray-700">
                                        Name
                                    </Text>

                                    <Text className="text-xs text-gray-400">
                                        {
                                            form.repName
                                                .length
                                        }
                                        /120
                                    </Text>
                                </View>

                                <TextInput
                                    value={
                                        form.repName
                                    }
                                    onChangeText={(
                                        value
                                    ) =>
                                        handleChange(
                                            "repName",
                                            value.slice(
                                                0,
                                                120
                                            )
                                        )
                                    }
                                    placeholder="Name"
                                    placeholderTextColor="#9ca3af"
                                    autoCapitalize="words"
                                    className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800"
                                />
                            </View>

                            {/* Phone */}

                            <View className="mb-4">
                                <View className="mb-1.5 flex-row justify-between">
                                    <Text className="text-sm font-medium text-gray-700">
                                        Phone
                                    </Text>

                                    <Text className="text-xs text-gray-400">
                                        {
                                            form.repPhone
                                                .length
                                        }
                                        /20
                                    </Text>
                                </View>

                                <TextInput
                                    value={
                                        form.repPhone
                                    }
                                    onChangeText={(
                                        value
                                    ) => {
                                        const clean =
                                            value
                                                .replace(
                                                    /[^\d()+\-\s]/g,
                                                    ""
                                                )
                                                .slice(
                                                    0,
                                                    20
                                                );

                                        handleChange(
                                            "repPhone",
                                            clean
                                        );
                                    }}
                                    placeholder="Phone"
                                    placeholderTextColor="#9ca3af"
                                    keyboardType="phone-pad"
                                    className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800"
                                />
                            </View>

                            {/* Email */}

                            <View>
                                <View className="mb-1.5 flex-row justify-between">
                                    <Text className="text-sm font-medium text-gray-700">
                                        Email
                                    </Text>

                                    <Text className="text-xs text-gray-400">
                                        {
                                            form.repEmail
                                                .length
                                        }
                                        /120
                                    </Text>
                                </View>

                                <TextInput
                                    value={
                                        form.repEmail
                                    }
                                    onChangeText={(
                                        value
                                    ) =>
                                        handleChange(
                                            "repEmail",
                                            value.slice(
                                                0,
                                                120
                                            )
                                        )
                                    }
                                    placeholder="Email"
                                    placeholderTextColor="#9ca3af"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800"
                                />
                            </View>
                        </View>

                        {/* ==========================================
                            SAVE
                        ========================================== */}

                        <Pressable
                            disabled={saving}
                            onPress={handleSave}
                            className={`mb-4 flex-row items-center justify-center rounded-xl px-6 py-3.5 ${
                                saving
                                    ? "bg-[#B8860B]/60"
                                    : "bg-[#B8860B] active:bg-[#9c7309]"
                            }`}
                        >
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

                            <Text className="ml-2 text-sm font-semibold text-white">
                                {saving
                                    ? "Saving..."
                                    : "Save Settings"}
                            </Text>
                        </Pressable>
                    </>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}