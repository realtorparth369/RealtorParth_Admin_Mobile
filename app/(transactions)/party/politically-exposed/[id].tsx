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
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import { useAuth } from "../../../../contexts/AuthContext";

const API_BASE = "https://realtorparth.ca/api";

interface FormData {
    txtIndividual: string;

    chkOpt_Determine1: boolean;
    chkOpt_Determine2: boolean;
    chkOpt_Determine3: boolean;
    chkOpt_Determine4: boolean;

    chkOpt_Determination1: boolean;
    chkOpt_Determination2: boolean;
    chkOpt_Determination3: boolean;
    chkOpt_Determination4: boolean;

    txtDeterminationOther: string;
    txtDetermineDate: "";

    txtPEP: string;
    txtOrganization: string;

    chkOpt_Risk: string;

    txtSource: string;

    chkOpt_Completed: boolean;

    radio_group_27zujm: string;

    txtCashSource: string;
    txtWealthSource: string;
    txtManagement: string;
    txtManagementDate: string;
}

const INITIAL_FORM: FormData = {
    txtIndividual: "",

    chkOpt_Determine1: false,
    chkOpt_Determine2: false,
    chkOpt_Determine3: false,
    chkOpt_Determine4: false,

    chkOpt_Determination1: false,
    chkOpt_Determination2: false,
    chkOpt_Determination3: false,
    chkOpt_Determination4: false,

    txtDeterminationOther: "",
    txtDetermineDate: "",

    txtPEP: "",
    txtOrganization: "",

    chkOpt_Risk: "",

    txtSource: "",

    chkOpt_Completed: false,

    radio_group_27zujm: "",

    txtCashSource: "",
    txtWealthSource: "",
    txtManagement: "",
    txtManagementDate: "",
};

function FieldLabel({
    children,
    count,
}: {
    children: React.ReactNode;
    count?: string;
}) {
    return (
        <View className="mb-1 flex-row items-center justify-between">
            <Text className="text-sm font-medium text-gray-700">
                {children}
            </Text>

            {count && (
                <Text className="text-xs text-gray-400">
                    {count}
                </Text>
            )}
        </View>
    );
}

function CheckboxRow({
    checked,
    label,
    onPress,
}: {
    checked: boolean;
    label: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            className="mb-3 flex-row items-center"
        >
            <View
                className={`h-5 w-5 items-center justify-center rounded border ${checked
                        ? "border-[#B8860B] bg-[#B8860B]"
                        : "border-gray-400 bg-white"
                    }`}
            >
                {checked && (
                    <Ionicons
                        name="checkmark"
                        size={14}
                        color="#ffffff"
                    />
                )}
            </View>

            <Text className="ml-3 flex-1 text-sm leading-5 text-gray-700">
                {label}
            </Text>
        </Pressable>
    );
}

function RadioRow({
    selected,
    label,
    onPress,
}: {
    selected: boolean;
    label: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            className="flex-row items-center"
        >
            <View
                className={`h-5 w-5 items-center justify-center rounded-full border ${selected
                        ? "border-[#B8860B]"
                        : "border-gray-400"
                    }`}
            >
                {selected && (
                    <View className="h-2.5 w-2.5 rounded-full bg-[#B8860B]" />
                )}
            </View>

            <Text className="ml-2 text-sm text-gray-700">
                {label}
            </Text>
        </Pressable>
    );
}

export default function PoliticallyExposedForm() {
    const router = useRouter();

    const params = useLocalSearchParams<{
        id: string;
        mode?: string;
    }>();

    const id = Array.isArray(params.id)
        ? params.id[0]
        : params.id;

    const mode = Array.isArray(params.mode)
        ? params.mode[0]
        : params.mode;

    const isAdmin = mode === "admin";

    const { user } = useAuth();

    const [checkingAuth, setCheckingAuth] =
        useState(isAdmin);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [isSaved, setIsSaved] =
        useState(false);

    const [formData, setFormData] =
        useState<FormData>(INITIAL_FORM);

    // ============================================================
    // ADMIN AUTH
    // ============================================================

    useEffect(() => {
        if (!isAdmin) {
            setCheckingAuth(false);
            return;
        }

        // Mobile Admin session is already authenticated.
        if (user) {
            setCheckingAuth(false);
        }
    }, [isAdmin, user]);

    // ============================================================
    // LOAD SAVED DATA
    // ============================================================

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        // Wait until Admin authentication has been checked.
        if (isAdmin && checkingAuth) {
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);

                const controller =
                    new AbortController();

                const timeout = setTimeout(() => {
                    controller.abort();
                }, 10000);

                const res = await fetch(
                    `${API_BASE}/fintracpeppdf/pep/user/${encodeURIComponent(
                        id
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
                    setFormData((prev) => ({
                        ...prev,
                        ...data.data,
                    }));

                    setIsSaved(true);
                }
            } catch (error: any) {
                console.error(
                    "PEP LOAD ERROR:",
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
                        "Failed to load data."
                    );
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [
        id,
        isAdmin,
        checkingAuth,
    ]);

    // ============================================================
    // FIELD HELPERS
    // ============================================================

    const updateText = (
        field: keyof FormData,
        value: string,
        maxLength?: number
    ) => {
        const finalValue =
            typeof maxLength === "number"
                ? value.slice(0, maxLength)
                : value;

        setFormData((prev) => ({
            ...prev,
            [field]: finalValue,
        }));
    };

    const updateCheckbox = (
        field: keyof FormData
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const updateRadio = (
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

    const handleSubmit = async () => {
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
            };

            const controller = new AbortController();

            const timeout = setTimeout(() => {
                controller.abort();
            }, 20000);

            const res = await fetch(
                `${API_BASE}/fintracpeppdf/generate-pep`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal,
                }
            );

            clearTimeout(timeout);

            if (!res.ok) {
                let errorMessage =
                    "Failed to generate PEP PDF";

                try {
                    const errorData =
                        await res.json();

                    errorMessage =
                        errorData?.message ||
                        errorMessage;
                } catch {
                    // Keep default error.
                }

                throw new Error(errorMessage);
            }

            const contentType =
                res.headers.get("content-type") || "";

            // ========================================================
            // PDF RESPONSE
            // ========================================================

            if (
                contentType.includes("application/pdf")
            ) {
                const arrayBuffer =
                    await res.arrayBuffer();

                const uint8Array =
                    new Uint8Array(arrayBuffer);

                // Convert PDF bytes to base64
                let binary = "";

                const chunkSize = 0x8000;

                for (
                    let i = 0;
                    i < uint8Array.length;
                    i += chunkSize
                ) {
                    const chunk =
                        uint8Array.subarray(
                            i,
                            Math.min(
                                i + chunkSize,
                                uint8Array.length
                            )
                        );

                    binary += String.fromCharCode(
                        ...chunk
                    );
                }

                const base64 =
                    btoa(binary);

                const fileName =
                    "Politically_Exposed_Person_Checklist.pdf";

                const fileUri =
                    `${FileSystem.cacheDirectory}${fileName}`;

                // Save PDF to device cache
                await FileSystem.writeAsStringAsync(
                    fileUri,
                    base64,
                    {
                        encoding:
                            FileSystem.EncodingType.Base64,
                    }
                );

                setIsSaved(true);

                // ====================================================
                // OPEN NATIVE SHARE / SAVE SHEET
                // ====================================================

                const sharingAvailable =
                    await Sharing.isAvailableAsync();

                if (sharingAvailable) {
                    await Sharing.shareAsync(
                        fileUri,
                        {
                            mimeType:
                                "application/pdf",
                            dialogTitle:
                                "Save or open PEP PDF",
                            UTI:
                                "com.adobe.pdf",
                        }
                    );
                } else {
                    Alert.alert(
                        "PDF Generated",
                        "The PEP PDF was generated successfully, but sharing is not available on this device."
                    );
                }

                // ====================================================
                // ADMIN MODE
                // ====================================================

                if (isAdmin) {
                    return;
                }

                // ====================================================
                // NORMAL TRANSACTION WORKFLOW
                // ====================================================

                Alert.alert(
                    "Success",
                    "Politically Exposed form saved successfully.",
                    [
                        {
                            text: "OK",
                            onPress: () => {
                                router.replace(
                                    `/(transactions)/party/crg/${id}` as any
                                );
                            },
                        },
                    ]
                );

                return;
            }

            // ========================================================
            // NON-PDF RESPONSE
            // ========================================================

            let data: any = null;

            try {
                data = await res.json();
            } catch {
                // Ignore invalid JSON.
            }

            setIsSaved(true);

            if (isAdmin) {
                Alert.alert(
                    "Success",
                    data?.message ||
                    "PEP form updated successfully."
                );
            } else {
                Alert.alert(
                    "Success",
                    data?.message ||
                    "Politically Exposed form saved successfully.",
                    [
                        {
                            text: "OK",
                            onPress: () => {
                                router.replace(
                                    `/(transactions)/party/crg/${id}` as any
                                );
                            },
                        },
                    ]
                );
            }
        } catch (error: any) {
            console.error(
                "PEP SUBMIT ERROR:",
                error
            );

            if (
                error?.name === "AbortError"
            ) {
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
                    "Error generating PEP PDF."
                );
            }
        } finally {
            setSaving(false);
        }
    };
    // const handleSubmit = async () => {
    //     if (!id) {
    //         Alert.alert(
    //             "Error",
    //             "Party not found."
    //         );
    //         return;
    //     }

    //     try {
    //         setSaving(true);

    //         const payload = {
    //             ...formData,
    //             partyId: id,
    //         };

    //         const controller =
    //             new AbortController();

    //         const timeout = setTimeout(() => {
    //             controller.abort();
    //         }, 20000);

    //         const res = await fetch(
    //             `${API_BASE}/fintracpeppdf/generate-pep`,
    //             {
    //                 method: "POST",

    //                 headers: {
    //                     "Content-Type":
    //                         "application/json",
    //                 },

    //                 body: JSON.stringify(
    //                     payload
    //                 ),

    //                 signal: controller.signal,
    //             }
    //         );

    //         clearTimeout(timeout);

    //         if (!res.ok) {
    //             let errorMessage =
    //                 "Failed to generate PDF";

    //             try {
    //                 const errorData =
    //                     await res.json();

    //                 errorMessage =
    //                     errorData?.message ||
    //                     errorMessage;
    //             } catch {
    //                 // Keep default message.
    //             }

    //             throw new Error(
    //                 errorMessage
    //             );
    //         }

    //         /**
    //          * The website receives a PDF blob here.
    //          *
    //          * React Native does not support:
    //          * window.URL.createObjectURL()
    //          * document.createElement()
    //          *
    //          * The API request itself remains identical.
    //          *
    //          * The response can be connected to
    //          * expo-file-system / expo-sharing if you
    //          * want actual PDF saving/opening.
    //          */

    //         try {
    //             await res.arrayBuffer();
    //         } catch {
    //             // Response was already successful.
    //         }

    //         setIsSaved(true);

    //         if (isAdmin) {
    //             Alert.alert(
    //                 "Success",
    //                 "PEP form updated successfully."
    //             );
    //         } else {
    //             Alert.alert(
    //                 "Success",
    //                 "Politically Exposed form saved successfully.",
    //                 [
    //                     {
    //                         text: "OK",
    //                         onPress: () => {
    //                             router.replace(
    //                                 `/(transactions)/party/crg/${id}` as any
    //                             );
    //                         },
    //                     },
    //                 ]
    //             );
    //         }
    //     } catch (error: any) {
    //         console.error(
    //             "PEP SUBMIT ERROR:",
    //             error
    //         );

    //         if (
    //             error?.name ===
    //             "AbortError"
    //         ) {
    //             Alert.alert(
    //                 "Timeout",
    //                 "The request timed out. Please try again."
    //             );
    //         } else if (
    //             error?.name ===
    //             "TypeError"
    //         ) {
    //             Alert.alert(
    //                 "Network Error",
    //                 "Server down or network error."
    //             );
    //         } else {
    //             Alert.alert(
    //                 "Error",
    //                 error?.message ||
    //                     "Error generating PEP PDF."
    //             );
    //         }
    //     } finally {
    //         setSaving(false);
    //     }
    // };

    // ============================================================
    // AUTH LOADING
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
    // DATA LOADING
    // ============================================================

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator
                    size="large"
                    color="#2563eb"
                />

                <Text className="mt-3 text-sm text-slate-500">
                    Loading PEP form...
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
                    paddingBottom: 50,
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
                                size={17}
                                color="#2563eb"
                            />

                            <Text className="ml-2 flex-1 text-sm font-medium text-blue-600">
                                Admin Mode – You can edit but not
                                change workflow
                            </Text>
                        </View>
                    )} */}

                    <Text className="text-xl font-semibold leading-7 text-gray-800">
                        Politically Exposed Person / Head of
                        International Organization Checklist
                    </Text>
                </View>

                {/* ==================================================
                    1. INDIVIDUAL
                ================================================== */}

                <View className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
                    <FieldLabel
                        count={`${formData.txtIndividual.length}/100`}
                    >
                        Name of individual under review
                    </FieldLabel>

                    <TextInput
                        value={
                            formData.txtIndividual
                        }
                        onChangeText={(value) =>
                            updateText(
                                "txtIndividual",
                                value,
                                100
                            )
                        }
                        placeholder="Enter individual's name"
                        placeholderTextColor="#9ca3af"
                        className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800"
                        autoCapitalize="words"
                    />
                </View>

                {/* ==================================================
                    2A
                ================================================== */}

                <View className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
                    <Text className="mb-4 text-base font-semibold text-gray-800">
                        2A. Determine whether the individual is:
                    </Text>

                    <CheckboxRow
                        checked={
                            formData.chkOpt_Determine1
                        }
                        label="Politically exposed foreign person"
                        onPress={() =>
                            updateCheckbox(
                                "chkOpt_Determine1"
                            )
                        }
                    />

                    <CheckboxRow
                        checked={
                            formData.chkOpt_Determine2
                        }
                        label="Politically exposed domestic person"
                        onPress={() =>
                            updateCheckbox(
                                "chkOpt_Determine2"
                            )
                        }
                    />

                    <CheckboxRow
                        checked={
                            formData.chkOpt_Determine3
                        }
                        label="Head of international organization"
                        onPress={() =>
                            updateCheckbox(
                                "chkOpt_Determine3"
                            )
                        }
                    />

                    <CheckboxRow
                        checked={
                            formData.chkOpt_Determine4
                        }
                        label="None of the above"
                        onPress={() =>
                            updateCheckbox(
                                "chkOpt_Determine4"
                            )
                        }
                    />
                </View>

                {/* ==================================================
                    2B
                ================================================== */}

                <View className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
                    <Text className="mb-4 text-base font-semibold text-gray-800">
                        2B. How was this determination made?
                    </Text>

                    <CheckboxRow
                        checked={
                            formData.chkOpt_Determination1
                        }
                        label="Asked individual"
                        onPress={() =>
                            updateCheckbox(
                                "chkOpt_Determination1"
                            )
                        }
                    />

                    <CheckboxRow
                        checked={
                            formData.chkOpt_Determination2
                        }
                        label="Internet search"
                        onPress={() =>
                            updateCheckbox(
                                "chkOpt_Determination2"
                            )
                        }
                    />

                    <CheckboxRow
                        checked={
                            formData.chkOpt_Determination3
                        }
                        label="Commercial PEP/HIO database"
                        onPress={() =>
                            updateCheckbox(
                                "chkOpt_Determination3"
                            )
                        }
                    />

                    <CheckboxRow
                        checked={
                            formData.chkOpt_Determination4
                        }
                        label="Other"
                        onPress={() =>
                            updateCheckbox(
                                "chkOpt_Determination4"
                            )
                        }
                    />

                    <View className="mt-2">
                        <FieldLabel
                            count={`${formData.txtDeterminationOther.length}/80`}
                        >
                            Other explanation
                        </FieldLabel>

                        <TextInput
                            value={
                                formData.txtDeterminationOther
                            }
                            onChangeText={(value) =>
                                updateText(
                                    "txtDeterminationOther",
                                    value,
                                    80
                                )
                            }
                            placeholder="Explain..."
                            placeholderTextColor="#9ca3af"
                            className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800"
                        />
                    </View>
                </View>

                {/* ==================================================
                    DETERMINATION DATE
                ================================================== */}

                <View className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
                    <FieldLabel>
                        Determination Date
                    </FieldLabel>

                    <TextInput
                        value={
                            formData.txtDetermineDate
                        }
                        onChangeText={(value) =>
                            updateText(
                                "txtDetermineDate",
                                value
                            )
                        }
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#9ca3af"
                        keyboardType="numbers-and-punctuation"
                        className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800"
                    />

                    <Text className="mt-1 text-xs text-gray-400">
                        Enter date as YYYY-MM-DD
                    </Text>
                </View>

                {/* ==================================================
                    POSITION
                ================================================== */}

                <View className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
                    <FieldLabel
                        count={`${formData.txtPEP.length}/100`}
                    >
                        Position held by PEP/HIO
                    </FieldLabel>

                    <TextInput
                        value={
                            formData.txtPEP
                        }
                        onChangeText={(value) =>
                            updateText(
                                "txtPEP",
                                value,
                                100
                            )
                        }
                        placeholder="Position held"
                        placeholderTextColor="#9ca3af"
                        className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800"
                    />
                </View>

                {/* ==================================================
                    ORGANIZATION
                ================================================== */}

                <View className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
                    <FieldLabel
                        count={`${formData.txtOrganization.length}/80`}
                    >
                        Organization Name
                    </FieldLabel>

                    <TextInput
                        value={
                            formData.txtOrganization
                        }
                        onChangeText={(value) =>
                            updateText(
                                "txtOrganization",
                                value,
                                80
                            )
                        }
                        placeholder="Organization name"
                        placeholderTextColor="#9ca3af"
                        className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800"
                    />
                </View>

                {/* ==================================================
                    6A RISK
                ================================================== */}

                <View className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
                    <Text className="mb-4 text-sm font-semibold text-gray-700">
                        6A. Is client high risk according to
                        brokerage policies?
                    </Text>

                    <View className="flex-row gap-8">
                        <RadioRow
                            selected={
                                formData.chkOpt_Risk ===
                                "yes"
                            }
                            label="Yes"
                            onPress={() =>
                                updateRadio(
                                    "chkOpt_Risk",
                                    "yes"
                                )
                            }
                        />

                        <RadioRow
                            selected={
                                formData.chkOpt_Risk ===
                                "no"
                            }
                            label="No"
                            onPress={() =>
                                updateRadio(
                                    "chkOpt_Risk",
                                    "no"
                                )
                            }
                        />
                    </View>
                </View>

                {/* ==================================================
                    SOURCE OF WEALTH
                ================================================== */}

                <View className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
                    <FieldLabel
                        count={`${formData.txtSource.length}/180`}
                    >
                        Source of individual's wealth
                    </FieldLabel>

                    <TextInput
                        value={
                            formData.txtSource
                        }
                        onChangeText={(value) =>
                            updateText(
                                "txtSource",
                                value,
                                180
                            )
                        }
                        placeholder="Source of wealth"
                        placeholderTextColor="#9ca3af"
                        multiline
                        textAlignVertical="top"
                        className="min-h-[90px] rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800"
                    />
                </View>

                {/* ==================================================
                    ENHANCED MEASURES
                ================================================== */}

                <View className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
                    <CheckboxRow
                        checked={
                            formData.chkOpt_Completed
                        }
                        label="Enhanced measures completed"
                        onPress={() =>
                            updateCheckbox(
                                "chkOpt_Completed"
                            )
                        }
                    />
                </View>

                {/* ==================================================
                    7A
                ================================================== */}

                <View className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
                    <Text className="mb-4 text-sm font-semibold text-gray-700">
                        If $100,000 received — Is individual
                        high risk?
                    </Text>

                    <View className="flex-row gap-8">
                        <RadioRow
                            selected={
                                formData.radio_group_27zujm ===
                                "yes"
                            }
                            label="Yes"
                            onPress={() =>
                                updateRadio(
                                    "radio_group_27zujm",
                                    "yes"
                                )
                            }
                        />

                        <RadioRow
                            selected={
                                formData.radio_group_27zujm ===
                                "no"
                            }
                            label="No"
                            onPress={() =>
                                updateRadio(
                                    "radio_group_27zujm",
                                    "no"
                                )
                            }
                        />
                    </View>
                </View>

                {/* ==================================================
                    CASH / WEALTH / MANAGEMENT
                ================================================== */}

                <View className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
                    <Text className="mb-4 text-base font-semibold text-gray-800">
                        Additional Information
                    </Text>

                    {/* Cash Source */}

                    <View className="mb-5">
                        <FieldLabel
                            count={`${formData.txtCashSource.length}/100`}
                        >
                            Cash Source
                        </FieldLabel>

                        <TextInput
                            value={
                                formData.txtCashSource
                            }
                            onChangeText={(value) =>
                                updateText(
                                    "txtCashSource",
                                    value,
                                    100
                                )
                            }
                            placeholder="Cash Source"
                            placeholderTextColor="#9ca3af"
                            className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800"
                        />
                    </View>

                    {/* Wealth Source */}

                    <View className="mb-5">
                        <FieldLabel
                            count={`${formData.txtWealthSource.length}/100`}
                        >
                            Wealth Source
                        </FieldLabel>

                        <TextInput
                            value={
                                formData.txtWealthSource
                            }
                            onChangeText={(value) =>
                                updateText(
                                    "txtWealthSource",
                                    value,
                                    100
                                )
                            }
                            placeholder="Wealth Source"
                            placeholderTextColor="#9ca3af"
                            className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800"
                        />
                    </View>

                    {/* Management */}

                    <View>
                        <FieldLabel
                            count={`${formData.txtManagement.length}/100`}
                        >
                            Management
                        </FieldLabel>

                        <TextInput
                            value={
                                formData.txtManagement
                            }
                            onChangeText={(value) =>
                                updateText(
                                    "txtManagement",
                                    value,
                                    100
                                )
                            }
                            placeholder="Management"
                            placeholderTextColor="#9ca3af"
                            className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800"
                        />
                    </View>
                </View>

                {/* ==================================================
                    MANAGEMENT DATE
                ================================================== */}

                <View className="mb-6 rounded-2xl border border-gray-200 bg-white p-4">
                    <FieldLabel>
                        Management Date
                    </FieldLabel>

                    <TextInput
                        value={
                            formData.txtManagementDate
                        }
                        onChangeText={(value) =>
                            updateText(
                                "txtManagementDate",
                                value
                            )
                        }
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#9ca3af"
                        keyboardType="numbers-and-punctuation"
                        className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800"
                    />

                    <Text className="mt-1 text-xs text-gray-400">
                        Enter date as YYYY-MM-DD
                    </Text>
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

                            {/* Generate PDF */}

                            <Pressable
                                disabled={saving}
                                onPress={
                                    handleSubmit
                                }
                                className={`flex-row items-center justify-center rounded-xl px-5 py-3 ${saving
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
                                        name="document-text-outline"
                                        size={19}
                                        color="#ffffff"
                                    />
                                )}

                                <Text className="ml-2 text-sm font-semibold text-white">
                                    {saving
                                        ? "Generating..."
                                        : "Generate PDF"}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
} 