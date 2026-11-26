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
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../../../contexts/AuthContext";

const API_BASE = "https://realtorparth.ca/api";

interface FormData {
    consumerPrintName1: string;
    consumerEmail1: string;

    consumerPrintName2: string;
    consumerEmail2: string;

    signedDateM: string;
    signedDateD: string;
    signedYear: string;
}

interface PartySettings {
    name?: string;
    email?: string;
    identityData?: {
        passport?: {
            fullName?: string;
        };
        license?: {
            fullName?: string;
        };
    };
}

export default function CrgForm() {
    const router = useRouter();

    const params = useLocalSearchParams<{
        id: string;
        mode?: string;
    }>();

    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const mode = Array.isArray(params.mode) ? params.mode[0] : params.mode;

    const isAdmin = mode === "admin";

    const { user } = useAuth();

    const [checkingAuth, setCheckingAuth] = useState(isAdmin);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        consumerPrintName1: "",
        consumerEmail1: "",

        consumerPrintName2: "",
        consumerEmail2: "",

        signedDateM: "",
        signedDateD: "",
        signedYear: "",
    });

    // ============================================================
    // ADMIN AUTH
    // ============================================================

    useEffect(() => {
        if (!isAdmin) {
            setCheckingAuth(false);
            return;
        }

        if (!user) {
            return;
        }

        setCheckingAuth(false);
    }, [isAdmin, user]);

    // ============================================================
    // LOAD DATA
    // ============================================================

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        const loadData = async () => {
            try {
                setLoading(true);

                const controller = new AbortController();

                const timeout = setTimeout(() => {
                    controller.abort();
                }, 15000);

                const [
                    partyRes,
                    transactionRes,
                    adminRes,
                    crgRes,
                ] = await Promise.all([
                    fetch(
                        `${API_BASE}/transactions/parties/transactionParty/settings/${encodeURIComponent(
                            id
                        )}`,
                        {
                            signal: controller.signal,
                        }
                    ),

                    fetch(
                        `${API_BASE}/transactions/transaction/settings/${encodeURIComponent(
                            id
                        )}`,
                        {
                            signal: controller.signal,
                        }
                    ),

                    fetch(
                        `${API_BASE}/admin/settings/by-party/${encodeURIComponent(
                            id
                        )}`,
                        {
                            signal: controller.signal,
                        }
                    ),

                    fetch(
                        `${API_BASE}/crgpdf/crg/user/${encodeURIComponent(
                            id
                        )}`,
                        {
                            signal: controller.signal,
                        }
                    ),
                ]);

                clearTimeout(timeout);

                const parseJSON = async (res: Response) => {
                    try {
                        return await res.json();
                    } catch {
                        throw new Error("Invalid server response");
                    }
                };

                const [
                    partySettingsJson,
                    _transactionJson,
                    _adminJson,
                    crgJson,
                ] = await Promise.all([
                    parseJSON(partyRes),
                    parseJSON(transactionRes),
                    parseJSON(adminRes),
                    parseJSON(crgRes),
                ]);

                if (
                    !partyRes.ok ||
                    !transactionRes.ok ||
                    !adminRes.ok ||
                    !crgRes.ok
                ) {
                    throw new Error("Failed to load data");
                }

                const partySettings: PartySettings =
                    partySettingsJson?.data || {};

                const cleanData = crgJson?.data || {};

                // ====================================================
                // IDENTITY DATA
                // ====================================================

                const passport =
                    partySettings?.identityData?.passport?.fullName
                        ? partySettings.identityData.passport
                        : null;

                const license =
                    partySettings?.identityData?.license?.fullName
                        ? partySettings.identityData.license
                        : null;

                const fullName =
                    passport?.fullName ||
                    license?.fullName ||
                    partySettings?.name ||
                    "";

                setFormData((prev) => ({
                    ...prev,

                    consumerPrintName1:
                        cleanData?.consumerPrintName1 ||
                        prev.consumerPrintName1 ||
                        fullName,

                    consumerEmail1:
                        cleanData?.consumerEmail1 ||
                        prev.consumerEmail1 ||
                        partySettings?.email ||
                        "",

                    ...cleanData,
                }));
            } catch (error: any) {
                console.error("LOAD ERROR:", error);

                if (error?.name === "AbortError") {
                    Alert.alert(
                        "Timeout",
                        "The request timed out. Please try again."
                    );
                } else if (
                    error?.name === "TypeError"
                ) {
                    Alert.alert(
                        "Network Error",
                        "Server down or network error."
                    );
                } else {
                    Alert.alert(
                        "Error",
                        error?.message ||
                            "Failed to load data."
                    );
                }
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id]);

    // ============================================================
    // INPUT CHANGE
    // ============================================================

    const updateField = (
        field: keyof FormData,
        value: string
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // ============================================================
    // SUBMIT
    // ============================================================

    const handleSubmit = async (
        sendEmail = false
    ) => {
        if (!id) {
            Alert.alert(
                "Error",
                "Party not found."
            );
            return;
        }

        try {
            setSaving(true);

            const payload = {
                ...formData,
                partyId: id,
                sendEmail,
                isAdmin,
            };

            const controller =
                new AbortController();

            const timeout = setTimeout(() => {
                controller.abort();
            }, 20000);

            const res = await fetch(
                `${API_BASE}/crgpdf/generate-crg`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify(payload),

                    signal: controller.signal,
                }
            );

            clearTimeout(timeout);

            if (!res.ok) {
                throw new Error(
                    "Request failed"
                );
            }

            const contentType =
                res.headers.get(
                    "content-type"
                ) || "";

            // ====================================================
            // ADMIN → PDF RESPONSE
            // ====================================================

            if (
                contentType.includes(
                    "application/pdf"
                )
            ) {
                /**
                 * React Native does not have the browser's
                 * window.URL / Blob download flow.
                 *
                 * The backend has still successfully generated
                 * the PDF. We simply show success here.
                 *
                 * If you want the mobile app to actually save/open
                 * the PDF, we can add expo-file-system +
                 * expo-sharing afterward.
                 */

                Alert.alert(
                    "Success",
                    "Customer Relationship Guide updated successfully."
                );

                return;
            }

            // ====================================================
            // NORMAL SAVE
            // ====================================================

            try {
                await res.json();
            } catch {
                throw new Error(
                    "Invalid server response"
                );
            }

            Alert.alert(
                "Success",
                "Customer Relationship Guide saved successfully."
            );
        } catch (error: any) {
            console.error(
                "CRG SUBMIT ERROR:",
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
                    "Server down or network error."
                );
            } else {
                Alert.alert(
                    "Error",
                    error?.message ||
                        "Error processing request."
                );
            }
        } finally {
            setSaving(false);
        }
    };

    // ============================================================
    // AUTH CHECK
    // ============================================================

    if (
        isAdmin &&
        checkingAuth
    ) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator
                    size="large"
                    color="#2563eb"
                />

                <Text className="mt-3 text-sm text-slate-500">
                    Checking transaction authentication...
                </Text>
            </View>
        );
    }

    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator
                    size="large"
                    color="#2563eb"
                />

                <Text className="mt-3 text-sm text-slate-500">
                    Loading Customer Relationship Guide...
                </Text>
            </View>
        );
    }

    // ============================================================
    // SCREEN
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
            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    padding: 16,
                    paddingBottom: 40,
                }}
                keyboardShouldPersistTaps="handled"
            >
                {/* ==================================================
                    HEADER
                ================================================== */}

                <View className="mb-6">
                    {/* {isAdmin && (
                        <View className="mb-3 flex-row items-center rounded-lg bg-blue-50 px-3 py-2">
                            <Ionicons
                                name="shield-checkmark-outline"
                                size={16}
                                color="#2563eb"
                            />

                            <Text className="ml-2 text-sm font-medium text-blue-600">
                                Admin Mode – You can edit but not
                                change workflow
                            </Text>
                        </View>
                    )} */}

                    <Text className="text-xl font-semibold text-gray-800">
                        Consumer Relationships Guide
                    </Text>

                    <Text className="mt-1 text-sm leading-5 text-gray-500">
                        Real estate professionals must present
                        and discuss this guide.
                    </Text>
                </View>

                {/* ==================================================
                    CONSUMER 1
                ================================================== */}

                <View className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
                    <Text className="mb-4 text-base font-semibold text-gray-800">
                        Consumer 1
                    </Text>

                    {/* Name */}

                    <View className="mb-5">
                        <View className="mb-1 flex-row items-center justify-between">
                            <Text className="text-sm text-gray-600">
                                Consumer 1 Print Name
                            </Text>

                            <Text className="text-xs text-gray-400">
                                {
                                    formData
                                        .consumerPrintName1
                                        .length
                                }
                                /80
                            </Text>
                        </View>

                        <TextInput
                            value={
                                formData.consumerPrintName1
                            }
                            onChangeText={(value) =>
                                updateField(
                                    "consumerPrintName1",
                                    value.slice(
                                        0,
                                        80
                                    )
                                )
                            }
                            placeholder="Consumer 1 name"
                            placeholderTextColor="#9ca3af"
                            className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800"
                            autoCapitalize="words"
                        />
                    </View>

                    {/* Email */}

                    <View>
                        <Text className="mb-1 text-sm text-gray-600">
                            Consumer 1 Email
                        </Text>

                        <TextInput
                            value={
                                formData.consumerEmail1
                            }
                            onChangeText={(value) =>
                                updateField(
                                    "consumerEmail1",
                                    value
                                )
                            }
                            placeholder="consumer1@example.com"
                            placeholderTextColor="#9ca3af"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800"
                        />
                    </View>
                </View>

                {/* ==================================================
                    CONSUMER 2
                ================================================== */}

                <View className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
                    <Text className="mb-4 text-base font-semibold text-gray-800">
                        Consumer 2
                    </Text>

                    {/* Name */}

                    <View className="mb-5">
                        <View className="mb-1 flex-row items-center justify-between">
                            <Text className="text-sm text-gray-600">
                                Consumer 2 Print Name
                            </Text>

                            <Text className="text-xs text-gray-400">
                                {
                                    formData
                                        .consumerPrintName2
                                        .length
                                }
                                /80
                            </Text>
                        </View>

                        <TextInput
                            value={
                                formData.consumerPrintName2
                            }
                            onChangeText={(value) =>
                                updateField(
                                    "consumerPrintName2",
                                    value.slice(
                                        0,
                                        80
                                    )
                                )
                            }
                            placeholder="Optional"
                            placeholderTextColor="#9ca3af"
                            className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800"
                            autoCapitalize="words"
                        />
                    </View>

                    {/* Email only when Consumer 2 exists */}

                    {formData.consumerPrintName2.trim() !==
                        "" && (
                        <View>
                            <Text className="mb-1 text-sm text-gray-600">
                                Consumer 2 Email
                            </Text>

                            <TextInput
                                value={
                                    formData.consumerEmail2
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "consumerEmail2",
                                        value
                                    )
                                }
                                placeholder="consumer2@example.com"
                                placeholderTextColor="#9ca3af"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800"
                            />
                        </View>
                    )}
                </View>

                {/* ==================================================
                    SIGNATURE PLACEHOLDERS
                ================================================== */}

                <View className="mb-6 flex-row gap-3">
                    <View className="flex-1">
                        <TextInput
                            editable={false}
                            placeholder="Signature will appear here"
                            placeholderTextColor="#9ca3af"
                            className="rounded-xl border border-gray-300 bg-gray-100 px-3 py-3 text-sm text-gray-500"
                        />
                    </View>

                    <View className="flex-1">
                        <TextInput
                            editable={false}
                            placeholder="Signature will appear here"
                            placeholderTextColor="#9ca3af"
                            className="rounded-xl border border-gray-300 bg-gray-100 px-3 py-3 text-sm text-gray-500"
                        />
                    </View>
                </View>

                {/* ==================================================
                    ADMIN ACTIONS
                ================================================== */}

                {isAdmin && (
                    <View className="border-t border-gray-200 pt-5">
                        <View className="gap-3">
                            {/* Party Docs List */}

                            <Pressable
                                onPress={() =>
                                    router.push(
                                        `/(transactions)/partypdfdata/${id}` as any
                                    )
                                }
                                className="flex-row items-center justify-center rounded-xl border border-gray-300 bg-gray-100 px-5 py-3 active:bg-gray-200"
                            >
                                <Ionicons
                                    name="documents-outline"
                                    size={19}
                                    color="#374151"
                                />

                                <Text className="ml-2 text-sm font-semibold text-gray-700">
                                    Party Docs List
                                </Text>
                            </Pressable>

                            {/* Save */}

                            <Pressable
                                disabled={saving}
                                onPress={() =>
                                    handleSubmit(
                                        false
                                    )
                                }
                                className={`flex-row items-center justify-center rounded-xl px-5 py-3 ${
                                    saving
                                        ? "bg-green-400"
                                        : "bg-green-600 active:bg-green-700"
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
                                        size={19}
                                        color="#ffffff"
                                    />
                                )}

                                <Text className="ml-2 text-sm font-semibold text-white">
                                    {saving
                                        ? "Saving..."
                                        : "Save"}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}