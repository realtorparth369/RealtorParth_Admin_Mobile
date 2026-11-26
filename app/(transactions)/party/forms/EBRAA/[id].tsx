// app/(transactions)/party/forms/EBRAA/[id].tsx

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
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useAuth } from "../../../../../contexts/AuthContext";

const API_BASE = "https://realtorparth.ca/api";

interface FormData {
    agreementNumber: string;

    brokerageName1: string;
    brokerageName2: string;

    buyerName1: string;
    buyerName2: string;

    agreementRef: string;

    effectiveTime: string;
    effectiveDate: string;

    endTime: string;
    endDate: string;

    propertyType: string;
    marketAreas: string;
    otherAmendments: string;

    signedDate: string;

    buyerPrint1: string;
    buyerPrint2: string;

    witnessPrint1: string;
    witnessPrint2: string;

    repPrintName: string;

    buyerEmail1: string;
    buyerEmail2: string;

    witnessEmail1: string;
    witnessEmail2: string;

    repEmail: string;

    [key: string]: any;
}

interface TransactionUser {
    id?: string;
    _id?: string;
    userId?: string;
    name?: string;
    email?: string;
    role?: string;
    isSuperAdmin?: boolean;
}

const INITIAL_FORM: FormData = {
    agreementNumber: "",

    brokerageName1: "",
    brokerageName2: "",

    buyerName1: "",
    buyerName2: "",

    agreementRef: "",

    effectiveTime: "",
    effectiveDate: "",

    endTime: "",
    endDate: "",

    propertyType: "",
    marketAreas: "",
    otherAmendments: "",

    signedDate: "",

    buyerPrint1: "",
    buyerPrint2: "",

    witnessPrint1: "",
    witnessPrint2: "",

    repPrintName: "",

    buyerEmail1: "",
    buyerEmail2: "",

    witnessEmail1: "",
    witnessEmail2: "",

    repEmail: "",
};

const getTransactionUserId = (
    transactionUser: TransactionUser | null
): string | null => {
    if (!transactionUser) return null;

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

function Field({
    label,
    value,
    placeholder,
    onChangeText,
    maxLength,
    multiline = false,
    keyboardType,
    editable = true,
}: {
    label?: string;
    value: string;
    placeholder?: string;
    onChangeText: (value: string) => void;
    maxLength?: number;
    multiline?: boolean;
    keyboardType?: any;
    editable?: boolean;
}) {
    return (
        <View className="mb-4">
            {label ? (
                <Text className="mb-1.5 text-sm font-medium text-gray-700">
                    {label}
                </Text>
            ) : null}

            <TextInput
                value={value ?? ""}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                maxLength={maxLength}
                multiline={multiline}
                numberOfLines={multiline ? 5 : 1}
                keyboardType={keyboardType}
                editable={editable}
                textAlignVertical={
                    multiline ? "top" : "center"
                }
                className={`rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-800 ${
                    multiline ? "min-h-[120px]" : ""
                } ${!editable ? "bg-gray-100" : ""}`}
            />

            {maxLength ? (
                <Text className="mt-1 text-right text-xs text-gray-400">
                    {(value ?? "").length}/{maxLength}
                </Text>
            ) : null}
        </View>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <View className="mb-5 rounded-2xl bg-white p-5">
            <Text className="mb-4 text-lg font-bold text-gray-800">
                {title}
            </Text>

            {children}
        </View>
    );
}

function DateField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    const [showPicker, setShowPicker] = useState(false);

    const dateValue = value
        ? new Date(`${value}T00:00:00`)
        : new Date();

    return (
        <View className="mb-4">
            <Text className="mb-1.5 text-sm font-medium text-gray-700">
                {label}
            </Text>

            <Pressable
                onPress={() => setShowPicker(true)}
                className="flex-row items-center justify-between rounded-xl border border-gray-300 bg-white px-3.5 py-3"
            >
                <Text
                    className={
                        value
                            ? "text-sm text-gray-800"
                            : "text-sm text-gray-400"
                    }
                >
                    {value || `Select ${label}`}
                </Text>

                <Ionicons
                    name="calendar-outline"
                    size={20}
                    color="#6b7280"
                />
            </Pressable>

            {showPicker ? (
                <DateTimePicker
                    value={
                        isNaN(dateValue.getTime())
                            ? new Date()
                            : dateValue
                    }
                    mode="date"
                    display={
                        Platform.OS === "ios"
                            ? "spinner"
                            : "default"
                    }
                    onChange={(event, selectedDate) => {
                        if (Platform.OS !== "ios") {
                            setShowPicker(false);
                        }

                        if (selectedDate) {
                            const year =
                                selectedDate.getFullYear();

                            const month = String(
                                selectedDate.getMonth() + 1
                            ).padStart(2, "0");

                            const day = String(
                                selectedDate.getDate()
                            ).padStart(2, "0");

                            onChange(
                                `${year}-${month}-${day}`
                            );
                        }
                    }}
                />
            ) : null}

            {Platform.OS === "ios" && showPicker ? (
                <Pressable
                    onPress={() => setShowPicker(false)}
                    className="mt-2 self-end rounded-lg bg-gray-200 px-4 py-2"
                >
                    <Text className="font-semibold text-gray-700">
                        Done
                    </Text>
                </Pressable>
            ) : null}
        </View>
    );
}

function TimeField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    const [showPicker, setShowPicker] = useState(false);

    const getDate = () => {
        if (!value) return new Date();

        const [hours, minutes] = value
            .split(":")
            .map(Number);

        const date = new Date();

        if (
            Number.isFinite(hours) &&
            Number.isFinite(minutes)
        ) {
            date.setHours(hours);
            date.setMinutes(minutes);
        }

        return date;
    };

    return (
        <View className="mb-4">
            <Text className="mb-1.5 text-sm font-medium text-gray-700">
                {label}
            </Text>

            <Pressable
                onPress={() => setShowPicker(true)}
                className="flex-row items-center justify-between rounded-xl border border-gray-300 bg-white px-3.5 py-3"
            >
                <Text
                    className={
                        value
                            ? "text-sm text-gray-800"
                            : "text-sm text-gray-400"
                    }
                >
                    {value || `Select ${label}`}
                </Text>

                <Ionicons
                    name="time-outline"
                    size={20}
                    color="#6b7280"
                />
            </Pressable>

            {showPicker ? (
                <DateTimePicker
                    value={getDate()}
                    mode="time"
                    display={
                        Platform.OS === "ios"
                            ? "spinner"
                            : "default"
                    }
                    onChange={(event, selectedDate) => {
                        if (Platform.OS !== "ios") {
                            setShowPicker(false);
                        }

                        if (selectedDate) {
                            const hours = String(
                                selectedDate.getHours()
                            ).padStart(2, "0");

                            const minutes = String(
                                selectedDate.getMinutes()
                            ).padStart(2, "0");

                            onChange(
                                `${hours}:${minutes}`
                            );
                        }
                    }}
                />
            ) : null}

            {Platform.OS === "ios" && showPicker ? (
                <Pressable
                    onPress={() => setShowPicker(false)}
                    className="mt-2 self-end rounded-lg bg-gray-200 px-4 py-2"
                >
                    <Text className="font-semibold text-gray-700">
                        Done
                    </Text>
                </Pressable>
            ) : null}
        </View>
    );
}

export default function EBRAA() {
    const router = useRouter();

    const params = useLocalSearchParams<{
        id?: string;
        mode?: string;
    }>();

    const { user } = useAuth();

    const id = Array.isArray(params.id)
        ? params.id[0]
        : params.id;

    const mode = Array.isArray(params.mode)
        ? params.mode[0]
        : params.mode;

    const isAdmin = mode === "admin";

    const [
        checkingTransactionAuth,
        setCheckingTransactionAuth,
    ] = useState(isAdmin);

    const [
        transactionUserId,
        setTransactionUserId,
    ] = useState<string | null>(null);

    const [formData, setFormData] =
        useState<FormData>(INITIAL_FORM);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    /*
     * ============================================
     * ADMIN TRANSACTION ACCESS
     * ============================================
     *
     * Admin email
     *    ↓
     * check-super-admin
     *    ↓
     * transaction user
     *    ↓
     * transaction user ID
     */
    useEffect(() => {
        let mounted = true;

        const resolveTransactionUser = async () => {
            if (!isAdmin) {
                if (mounted) {
                    setCheckingTransactionAuth(false);
                }

                return;
            }

            if (!user?.email) {
                if (mounted) {
                    setCheckingTransactionAuth(false);
                }

                return;
            }

            try {
                const response = await fetch(
                    `${API_BASE}/transactions/check-super-admin/${encodeURIComponent(
                        user.email
                    )}`
                );

                const data = await response.json();

                if (
                    !response.ok ||
                    !data?.success ||
                    !data?.isSuperAdmin
                ) {
                    throw new Error(
                        "Transaction access could not be verified."
                    );
                }

                const transactionUser =
                    data.user ||
                    data.transactionUser ||
                    data.admin ||
                    data;

                const resolvedId =
                    getTransactionUserId(
                        transactionUser
                    );

                if (!resolvedId) {
                    throw new Error(
                        "Transaction user ID was not found."
                    );
                }

                if (mounted) {
                    setTransactionUserId(
                        resolvedId
                    );
                }
            } catch (error: any) {
                console.error(
                    "Transaction auth error:",
                    error
                );

                if (mounted) {
                    Alert.alert(
                        "Transaction Access",
                        error?.message ||
                            "Unable to verify transaction access."
                    );
                }
            } finally {
                if (mounted) {
                    setCheckingTransactionAuth(false);
                }
            }
        };

        resolveTransactionUser();

        return () => {
            mounted = false;
        };
    }, [isAdmin, user?.email]);

    /*
     * ============================================
     * LOAD EBRAA DATA
     * ============================================
     */
    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        const loadData = async () => {
            try {
                const controller =
                    new AbortController();

                const timeout = setTimeout(
                    () => controller.abort(),
                    15000
                );

                const [
                    partyRes,
                    transactionRes,
                    adminRes,
                    ebraaRes,
                ] = await Promise.all([
                    fetch(
                        `${API_BASE}/transactions/parties/transactionParty/settings/${id}`,
                        {
                            signal: controller.signal,
                        }
                    ),

                    fetch(
                        `${API_BASE}/transactions/transaction/settings/${id}`,
                        {
                            signal: controller.signal,
                        }
                    ),

                    fetch(
                        `${API_BASE}/admin/settings/by-party/${id}`,
                        {
                            signal: controller.signal,
                        }
                    ),

                    fetch(
                        `${API_BASE}/ebraapdf/buyer-amendment/user/${id}`,
                        {
                            signal: controller.signal,
                        }
                    ),
                ]);

                clearTimeout(timeout);

                const parseJSON = async (
                    response: Response
                ) => {
                    try {
                        return await response.json();
                    } catch {
                        throw new Error(
                            "Invalid server response"
                        );
                    }
                };

                const [
                    partysettingsJson,
                    transactionJson,
                    adminJson,
                    ebraaJson,
                ] = await Promise.all([
                    parseJSON(partyRes),
                    parseJSON(transactionRes),
                    parseJSON(adminRes),
                    parseJSON(ebraaRes),
                ]);

                if (
                    !partyRes.ok ||
                    !transactionRes.ok ||
                    !adminRes.ok ||
                    !ebraaRes.ok
                ) {
                    throw new Error(
                        "Failed to load EBRAA data."
                    );
                }

                const partysettings =
                    partysettingsJson?.data || {};

                const transactionsettings =
                    transactionJson?.data || {};

                const settings =
                    adminJson?.data || {};

                const cleanData =
                    ebraaJson?.data || {};

                /*
                 * ====================================
                 * Identity
                 * ====================================
                 */
                const passport =
                    partysettings?.identityData
                        ?.passport?.fullName
                        ? partysettings.identityData
                              .passport
                        : null;

                const license =
                    partysettings?.identityData
                        ?.license?.fullName
                        ? partysettings.identityData
                              .license
                        : null;

                const buyerFullName =
                    passport?.fullName ||
                    license?.fullName ||
                    partysettings?.name ||
                    "";

                setFormData((prev) => ({
                    ...prev,

                    /*
                     * Buyer
                     */
                    buyerName1:
                        cleanData?.buyerName1 ||
                        prev.buyerName1 ||
                        buyerFullName,

                    buyerPrint1:
                        cleanData?.buyerPrint1 ||
                        prev.buyerPrint1 ||
                        buyerFullName,

                    buyerEmail1:
                        cleanData?.buyerEmail1 ||
                        prev.buyerEmail1 ||
                        partysettings?.email ||
                        "",

                    buyerName2:
                        cleanData?.buyerName2 ||
                        prev.buyerName2 ||
                        "",

                    buyerEmail2:
                        cleanData?.buyerEmail2 ||
                        prev.buyerEmail2 ||
                        "",

                    /*
                     * Agreement
                     */
                    agreementNumber:
                        cleanData?.agreementNumber ||
                        prev.agreementNumber ||
                        transactionsettings?.agreementnumber ||
                        "",

                    agreementRef:
                        cleanData?.agreementRef ||
                        prev.agreementRef ||
                        transactionsettings?.agreementnumber ||
                        "",

                    /*
                     * Brokerage
                     */
                    brokerageName1:
                        cleanData?.brokerageName1 ||
                        prev.brokerageName1 ||
                        settings?.brokerageName ||
                        "",

                    brokerageName2:
                        cleanData?.brokerageName2 ||
                        prev.brokerageName2 ||
                        settings?.repName ||
                        "",

                    repPrintName:
                        cleanData?.repPrintName ||
                        prev.repPrintName ||
                        settings?.repName ||
                        "",

                    repEmail:
                        cleanData?.repEmail ||
                        prev.repEmail ||
                        settings?.repEmail ||
                        "",

                    witnessEmail1:
                        cleanData?.witnessEmail1 ||
                        prev.witnessEmail1 ||
                        "",

                    witnessEmail2:
                        cleanData?.witnessEmail2 ||
                        prev.witnessEmail2 ||
                        "",

                    /*
                     * Existing EBRAA data last
                     */
                    ...cleanData,
                }));

                if (ebraaJson?.data) {
                    setIsSaved(true);
                }
            } catch (error: any) {
                console.error(
                    "EBRAA LOAD ERROR:",
                    error
                );

                if (
                    error?.name === "AbortError"
                ) {
                    Alert.alert(
                        "Timeout",
                        "The request timed out."
                    );
                } else {
                    Alert.alert(
                        "Error",
                        error?.message ||
                            "Failed to load EBRAA data."
                    );
                }
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id]);

    /*
     * ============================================
     * FIELD UPDATE
     * ============================================
     */
    const updateField = (
        name: keyof FormData,
        value: string
    ) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    /*
     * ============================================
     * SUBMIT
     * ============================================
     */
    const handleSubmit = async () => {
        if (!id) {
            Alert.alert(
                "Party Not Found",
                "The party could not be found."
            );
            return;
        }

        setSaving(true);

        try {
            const payload = {
                ...formData,
                partyId: id,
                isAdmin,
            };

            const controller =
                new AbortController();

            const timeout = setTimeout(
                () => controller.abort(),
                20000
            );

            const response = await fetch(
                `${API_BASE}/ebraapdf/generate-buyer-amendment`,
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

            if (!response.ok) {
                let message =
                    "Request failed.";

                try {
                    const errorData =
                        await response.json();

                    message =
                        errorData?.message ||
                        message;
                } catch {
                    // Keep default
                }

                throw new Error(message);
            }

            const data = await response.json();

            /*
             * ====================================
             * ADMIN
             * ====================================
             */
            if (isAdmin) {
                setIsSaved(true);

                Alert.alert(
                    "Saved",
                    "Exclusive Buyer Representation Agreement Amendment saved successfully."
                );

                return;
            }

            /*
             * ====================================
             * NORMAL USER SIGNING
             * ====================================
             */
            if (data?.signingUrl) {
                Alert.alert(
                    "Continue to Signing",
                    "Your amendment is ready. Continue to the signing page.",
                    [
                        {
                            text: "Continue",
                            onPress: () => {
                                // React Native does not use
                                // window.location.href.
                                //
                                // Open the signing URL using
                                // Linking below.
                                import(
                                    "expo-linking"
                                ).then(
                                    ({
                                        openURL,
                                    }) => {
                                        openURL(
                                            data.signingUrl
                                        );
                                    }
                                );
                            },
                        },
                    ]
                );

                return;
            }

            throw new Error(
                "No signing URL received."
            );
        } catch (error: any) {
            console.error(
                "EBRAA SUBMIT ERROR:",
                error
            );

            if (
                error?.name === "AbortError"
            ) {
                Alert.alert(
                    "Timeout",
                    "The request timed out."
                );
            } else {
                Alert.alert(
                    "Error",
                    error?.message ||
                        "Error starting signing process."
                );
            }
        } finally {
            setSaving(false);
        }
    };

    /*
     * ============================================
     * LOADING
     * ============================================
     */
    if (
        checkingTransactionAuth ||
        loading
    ) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50 px-6">
                <ActivityIndicator
                    size="large"
                    color="#B8860B"
                />

                <Text className="mt-4 text-sm text-gray-500">
                    {checkingTransactionAuth
                        ? "Checking transaction authentication..."
                        : "Loading EBRAA form..."}
                </Text>
            </View>
        );
    }

    if (
        isAdmin &&
        user?.email &&
        !transactionUserId
    ) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50 px-6">
                <Ionicons
                    name="alert-circle-outline"
                    size={42}
                    color="#dc2626"
                />

                <Text className="mt-3 text-center text-lg font-bold text-gray-800">
                    Transaction access unavailable
                </Text>

                <Text className="mt-2 text-center text-sm text-gray-500">
                    We could not resolve your transaction
                    account.
                </Text>

                <Pressable
                    onPress={() =>
                        router.back()
                    }
                    className="mt-5 rounded-xl bg-gray-800 px-5 py-3"
                >
                    <Text className="font-semibold text-white">
                        Go Back
                    </Text>
                </Pressable>
            </View>
        );
    }

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
                showsVerticalScrollIndicator={false}
            >
                {/* ======================================
                    HEADER
                ====================================== */}

                {/* {isAdmin ? (
                    <View className="mb-4 flex-row items-center rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                        <Ionicons
                            name="shield-checkmark-outline"
                            size={20}
                            color="#2563eb"
                        />

                        <Text className="ml-2 flex-1 text-sm font-medium text-blue-700">
                            Admin Mode – You can edit but
                            not change workflow
                        </Text>
                    </View>
                ) : null} */}

                <View className="mb-5 rounded-2xl ">
                    {/* bg-white p-5 */}
                    <View className="flex-row items-center">
                        {/* <View className="h-11 w-11 items-center justify-center rounded-xl bg-[#B8860B]">
                            <Ionicons
                                name="document-text-outline"
                                size={23}
                                color="#ffffff"
                            />
                        </View> */}

                        <View className="ml-3 flex-1">
                            <Text className="text-xl font-bold text-gray-800">
                                Exclusive Buyer Representation
                                Agreement Amendment
                            </Text>

                        </View>

                        {isSaved ? (
                            <View className="rounded-full bg-green-50 px-3 py-1">
                                <Text className="text-xs font-semibold text-green-700">
                                    Saved
                                </Text>
                            </View>
                        ) : null}
                    </View>
                </View>

                {/* ======================================
                    BROKERAGE
                ====================================== */}

                <Section title="THE BROKERAGE (WE)">
                    <Field
                        label="Agreement Number"
                        value={
                            formData.agreementNumber
                        }
                        placeholder="Agreement Number"
                        onChangeText={(value) =>
                            updateField(
                                "agreementNumber",
                                value
                            )
                        }
                    />

                    <Text className="mb-3 text-sm font-medium text-gray-600">
                        Brokerage
                    </Text>

                    <Field
                        value={
                            formData.brokerageName1
                        }
                        placeholder="Name"
                        maxLength={100}
                        onChangeText={(value) =>
                            updateField(
                                "brokerageName1",
                                value.slice(
                                    0,
                                    100
                                )
                            )
                        }
                    />

                    <Field
                        value={
                            formData.brokerageName2
                        }
                        placeholder="Name"
                        maxLength={100}
                        onChangeText={(value) =>
                            updateField(
                                "brokerageName2",
                                value.slice(
                                    0,
                                    100
                                )
                            )
                        }
                    />
                </Section>

                {/* ======================================
                    BUYER
                ====================================== */}

                <Section title="THE BUYER (YOU)">
                    <Field
                        label="Buyer 1 Name"
                        value={
                            formData.buyerName1
                        }
                        placeholder="Name"
                        maxLength={80}
                        onChangeText={(value) =>
                            updateField(
                                "buyerName1",
                                value.slice(
                                    0,
                                    80
                                )
                            )
                        }
                    />

                    <Field
                        label="Buyer 2 Name"
                        value={
                            formData.buyerName2
                        }
                        placeholder="Name"
                        maxLength={80}
                        onChangeText={(value) =>
                            updateField(
                                "buyerName2",
                                value.slice(
                                    0,
                                    80
                                )
                            )
                        }
                    />
                </Section>

                {/* ======================================
                    AGREEMENT REFERENCE
                ====================================== */}

                <Section title="Agreement Being Amended">
                    <Field
                        label="Agreement # Being Amended"
                        value={
                            formData.agreementRef
                        }
                        placeholder="Agreement Number"
                        maxLength={40}
                        onChangeText={(value) =>
                            updateField(
                                "agreementRef",
                                value.slice(
                                    0,
                                    40
                                )
                            )
                        }
                    />
                </Section>

                {/* ======================================
                    EFFECTIVE DATE
                ====================================== */}

                <Section title="Amendment Effective Time & Date">
                    <TimeField
                        label="Effective Time"
                        value={
                            formData.effectiveTime
                        }
                        onChange={(value) =>
                            updateField(
                                "effectiveTime",
                                value
                            )
                        }
                    />

                    <DateField
                        label="Effective Date"
                        value={
                            formData.effectiveDate
                        }
                        onChange={(value) =>
                            updateField(
                                "effectiveDate",
                                value
                            )
                        }
                    />
                </Section>

                {/* ======================================
                    END DATE
                ====================================== */}

                <Section title="1. End Time & Date">
                    <TimeField
                        label="End Time"
                        value={
                            formData.endTime
                        }
                        onChange={(value) =>
                            updateField(
                                "endTime",
                                value
                            )
                        }
                    />

                    <DateField
                        label="End Date"
                        value={
                            formData.endDate
                        }
                        onChange={(value) =>
                            updateField(
                                "endDate",
                                value
                            )
                        }
                    />
                </Section>

                {/* ======================================
                    SEARCH CRITERIA
                ====================================== */}

                <Section title="2. Search Criteria">
                    <Field
                        label="Property Type"
                        value={
                            formData.propertyType
                        }
                        placeholder="Property Type"
                        maxLength={100}
                        onChangeText={(value) =>
                            updateField(
                                "propertyType",
                                value.slice(
                                    0,
                                    100
                                )
                            )
                        }
                    />

                    <Field
                        label="Market Areas"
                        value={
                            formData.marketAreas
                        }
                        placeholder="Market Areas"
                        maxLength={100}
                        onChangeText={(value) =>
                            updateField(
                                "marketAreas",
                                value.slice(
                                    0,
                                    100
                                )
                            )
                        }
                    />
                </Section>

                {/* ======================================
                    OTHER AMENDMENTS
                ====================================== */}

                <Section title="3. Other Amendments">
                    <Field
                        label="Other Amendments"
                        value={
                            formData.otherAmendments
                        }
                        placeholder="Other Amendments"
                        maxLength={1000}
                        multiline
                        onChangeText={(value) =>
                            updateField(
                                "otherAmendments",
                                value.slice(
                                    0,
                                    1000
                                )
                            )
                        }
                    />
                </Section>

                {/* ======================================
                    BUYER SIGNATURES
                ====================================== */}

                <Section title="Buyer Signatures">
                    <View className="mb-4 flex-row">
                        <View className="mr-2 flex-1 rounded-xl border border-gray-200 bg-gray-100 px-3 py-3">
                            <Text className="text-sm text-gray-400">
                                Signature of Buyer
                            </Text>
                        </View>

                        <View className="flex-1 rounded-xl border border-gray-200 bg-gray-100 px-3 py-3">
                            <Text className="text-sm text-gray-400">
                                Signature of Buyer
                            </Text>
                        </View>
                    </View>

                    <Text className="mb-2 text-sm font-semibold text-gray-600">
                        Buyer 1
                    </Text>

                    <Field
                        label="Buyer Name"
                        value={
                            formData.buyerPrint1
                        }
                        placeholder="Buyer Name"
                        maxLength={80}
                        onChangeText={(value) =>
                            updateField(
                                "buyerPrint1",
                                value.slice(
                                    0,
                                    80
                                )
                            )
                        }
                    />

                    <Field
                        label="Buyer 1 Email"
                        value={
                            formData.buyerEmail1
                        }
                        placeholder="Buyer 1 Email"
                        keyboardType="email-address"
                        onChangeText={(value) =>
                            updateField(
                                "buyerEmail1",
                                value
                            )
                        }
                    />

                    <Text className="mb-2 mt-2 text-sm font-semibold text-gray-600">
                        Buyer 2
                    </Text>

                    <Field
                        label="Buyer Name"
                        value={
                            formData.buyerPrint2
                        }
                        placeholder="Buyer Name"
                        maxLength={80}
                        onChangeText={(value) =>
                            updateField(
                                "buyerPrint2",
                                value.slice(
                                    0,
                                    80
                                )
                            )
                        }
                    />

                    {formData.buyerName2.trim() ? (
                        <Field
                            label="Buyer 2 Email"
                            value={
                                formData.buyerEmail2
                            }
                            placeholder="Buyer 2 Email"
                            keyboardType="email-address"
                            onChangeText={(value) =>
                                updateField(
                                    "buyerEmail2",
                                    value
                                )
                            }
                        />
                    ) : null}
                </Section>

                {/* ======================================
                    WITNESS
                ====================================== */}

                <Section title="Witness">
                    <View className="mb-4 flex-row">
                        <View className="mr-2 flex-1 rounded-xl border border-gray-200 bg-gray-100 px-3 py-3">
                            <Text className="text-sm text-gray-400">
                                Signature of Witness
                            </Text>
                        </View>

                        <View className="flex-1 rounded-xl border border-gray-200 bg-gray-100 px-3 py-3">
                            <Text className="text-sm text-gray-400">
                                Signature of Witness
                            </Text>
                        </View>
                    </View>

                    <Text className="mb-2 text-sm font-semibold text-gray-600">
                        Witness 1
                    </Text>

                    <Field
                        label="Witness 1"
                        value={
                            formData.witnessPrint1
                        }
                        placeholder="Witness 1"
                        onChangeText={(value) =>
                            updateField(
                                "witnessPrint1",
                                value
                            )
                        }
                    />

                    {formData.witnessPrint1.trim() ? (
                        <Field
                            label="Witness 1 Email"
                            value={
                                formData.witnessEmail1
                            }
                            placeholder="Witness 1 Email"
                            keyboardType="email-address"
                            onChangeText={(value) =>
                                updateField(
                                    "witnessEmail1",
                                    value
                                )
                            }
                        />
                    ) : null}

                    <Text className="mb-2 mt-2 text-sm font-semibold text-gray-600">
                        Witness 2
                    </Text>

                    <Field
                        label="Witness 2"
                        value={
                            formData.witnessPrint2
                        }
                        placeholder="Witness 2"
                        onChangeText={(value) =>
                            updateField(
                                "witnessPrint2",
                                value
                            )
                        }
                    />

                    {formData.witnessPrint2.trim() ? (
                        <Field
                            label="Witness 2 Email"
                            value={
                                formData.witnessEmail2
                            }
                            placeholder="Witness 2 Email"
                            keyboardType="email-address"
                            onChangeText={(value) =>
                                updateField(
                                    "witnessEmail2",
                                    value
                                )
                            }
                        />
                    ) : null}
                </Section>

                {/* ======================================
                    BROKERAGE REPRESENTATIVE
                ====================================== */}

                <Section title="Brokerage Representative">
                    <View className="mb-4 rounded-xl border border-gray-200 bg-gray-100 px-3 py-3">
                        <Text className="text-sm text-gray-400">
                            Signature
                        </Text>
                    </View>

                    <Field
                        label="Print Name"
                        value={
                            formData.repPrintName
                        }
                        placeholder="Print Name"
                        onChangeText={(value) =>
                            updateField(
                                "repPrintName",
                                value
                            )
                        }
                    />
                </Section>

                {/* ======================================
                    BUTTONS
                ====================================== */}

                <View className="mt-1 border-t border-gray-200 pt-5">
                    <Pressable
                        onPress={() =>
                            router.push(
                                `/(transactions)/partypdfdata/${id}` as any
                            )
                        }
                        className="mb-3 flex-row items-center justify-center rounded-xl bg-gray-100 px-4 py-3.5"
                    >
                        <Ionicons
                            name="arrow-back"
                            size={19}
                            color="#374151"
                        />

                        <Text className="ml-2 font-semibold text-gray-700">
                            Party Docs List
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={handleSubmit}
                        disabled={saving}
                        className={`flex-row items-center justify-center rounded-xl px-4 py-3.5 ${
                            saving
                                ? "bg-gray-400"
                                : "bg-green-600"
                        }`}
                    >
                        {saving ? (
                            <ActivityIndicator
                                size="small"
                                color="#ffffff"
                            />
                        ) : (
                            <Ionicons
                                name={
                                    isAdmin
                                        ? "save-outline"
                                        : "create-outline"
                                }
                                size={19}
                                color="#ffffff"
                            />
                        )}

                        <Text className="ml-2 font-bold text-white">
                            {saving
                                ? "Saving..."
                                : "Save"}
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}