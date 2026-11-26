import React, { useEffect, useState } from "react";

import {
    Alert,
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

type TransactionUser = {
    id?: string;
    _id?: string;
    userId?: string;
    name?: string;
    email?: string;
    role?: string;
    isSuperAdmin?: boolean;
};

const getTransactionUserId = (
    user: TransactionUser | null
): string | null => {
    if (!user) return null;

    if (typeof user.id === "string" && user.id.trim()) {
        return user.id;
    }

    if (typeof user._id === "string" && user._id.trim()) {
        return user._id;
    }

    if (typeof user.userId === "string" && user.userId.trim()) {
        return user.userId;
    }

    return null;
};

type FormData = {
    agreementNumber: string;
    brokerageName1: string;
    brokerageName2: string;
    buyerName1: string;
    buyerName2: string;
    terminateAgreement: string;
    terminationTime: string;
    terminationDate: string;
    terminationType: string;
    additionalTerms: string;
    signedDate: string;
    buyerPrint1: string;
    buyerPrint2: string;
    witnessPrint1: string;
    witnessPrint2: string;
    brokerPrint: string;
    buyerEmail1: string;
    buyerEmail2: string;
    witnessEmail1: string;
    witnessEmail2: string;
    brokerEmail: string;
};

const initialFormData: FormData = {
    agreementNumber: "",
    brokerageName1: "",
    brokerageName2: "",
    buyerName1: "",
    buyerName2: "",
    terminateAgreement: "",
    terminationTime: "",
    terminationDate: "",
    terminationType: "",
    additionalTerms: "",
    signedDate: "",
    buyerPrint1: "",
    buyerPrint2: "",
    witnessPrint1: "",
    witnessPrint2: "",
    brokerPrint: "",
    buyerEmail1: "",
    buyerEmail2: "",
    witnessEmail1: "",
    witnessEmail2: "",
    brokerEmail: "",
};

/* =========================================================
   HELPERS
========================================================= */

function formatDateForAPI(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatTimeForAPI(date: Date) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
}

function parseDate(value: string) {
    if (!value) return new Date();

    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
        return parsed;
    }

    return new Date();
}

/* =========================================================
   UI COMPONENTS
========================================================= */

function Card({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <View className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
            {children}
        </View>
    );
}

function SectionTitle({
    title,
}: {
    title: string;
}) {
    return (
        <View className="mb-4 border-b border-gray-200 pb-3">
            <Text className="text-lg font-bold text-gray-800">
                {title}
            </Text>
        </View>
    );
}

function Field({
    label,
    value,
    onChangeText,
    placeholder,
    maxLength,
    keyboardType = "default",
    multiline = false,
    disabled = false,
}: {
    label?: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder?: string;
    maxLength?: number;
    keyboardType?: any;
    multiline?: boolean;
    disabled?: boolean;
}) {
    return (
        <View className="mb-4">
            {label ? (
                <Text className="mb-1.5 text-sm font-medium text-gray-700">
                    {label}
                </Text>
            ) : null}

            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                maxLength={maxLength}
                keyboardType={keyboardType}
                multiline={multiline}
                editable={!disabled}
                textAlignVertical={multiline ? "top" : "center"}
                className={[
                    "rounded-xl border border-gray-200 bg-white px-4 text-gray-800",
                    multiline
                        ? "min-h-[110px] py-3"
                        : "h-12",
                    disabled
                        ? "bg-gray-100 text-gray-400"
                        : "",
                ].join(" ")}
            />

            {maxLength ? (
                <Text className="mt-1 text-right text-xs text-gray-400">
                    {value.length}/{maxLength}
                </Text>
            ) : null}
        </View>
    );
}

function RadioOption({
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
            className="mb-3 flex-row items-center"
        >
            <View
                className={[
                    "h-5 w-5 items-center justify-center rounded-full border-2",
                    selected
                        ? "border-blue-600"
                        : "border-gray-300",
                ].join(" ")}
            >
                {selected ? (
                    <View className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                ) : null}
            </View>

            <Text className="ml-3 text-sm text-gray-700">
                {label}
            </Text>
        </Pressable>
    );
}

/* =========================================================
   SCREEN
========================================================= */

export default function EBRATDAForm() {
    const router = useRouter();

    const params = useLocalSearchParams<{
        id?: string;
        mode?: string;
    }>();

    const { user, loading: authLoading } = useAuth();

    const id = Array.isArray(params.id)
        ? params.id[0]
        : params.id;

    const isAdmin = params.mode === "admin";

    const [checkingTransactionAuth, setCheckingTransactionAuth] =
        useState(isAdmin);

    const [transactionUserId, setTransactionUserId] =
        useState<string | null>(null);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [formData, setFormData] =
        useState<FormData>(initialFormData);

    const [showTerminationDatePicker, setShowTerminationDatePicker] =
        useState(false);

    const [showTerminationTimePicker, setShowTerminationTimePicker] =
        useState(false);

    /* =====================================================
       FIELD UPDATE
    ===================================================== */

    const updateField = <K extends keyof FormData>(
        field: K,
        value: FormData[K]
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    /* =====================================================
       ADMIN AUTH BRIDGE
    ===================================================== */

    useEffect(() => {
        let cancelled = false;

        async function resolveTransactionUser() {
            if (!isAdmin) {
                setCheckingTransactionAuth(false);
                return;
            }

            if (authLoading) {
                return;
            }

            if (!user?.email) {
                if (!cancelled) {
                    setCheckingTransactionAuth(false);
                }

                Alert.alert(
                    "Authentication Required",
                    "Admin authentication was not found.",
                    [
                        {
                            text: "OK",
                            onPress: () =>
                                router.replace(
                                    "/(transactions)" as any
                                ),
                        },
                    ]
                );

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
                        data?.message ||
                            "Transaction admin access denied."
                    );
                }

                const transactionUser =
                    data?.user ||
                    data?.transactionUser ||
                    data?.admin ||
                    data;

                const resolvedId =
                    getTransactionUserId(
                        transactionUser
                    );

                if (!resolvedId) {
                    throw new Error(
                        "Transaction user ID was not returned by the server."
                    );
                }

                if (!cancelled) {
                    setTransactionUserId(resolvedId);
                    setCheckingTransactionAuth(false);
                }
            } catch (error: any) {
                console.error(
                    "Transaction auth bridge error:",
                    error
                );

                if (!cancelled) {
                    setCheckingTransactionAuth(false);

                    Alert.alert(
                        "Access Denied",
                        error?.message ||
                            "Unable to verify transaction access.",
                        [
                            {
                                text: "OK",
                                onPress: () =>
                                    router.replace(
                                        "/(transactions)" as any
                                    ),
                            },
                        ]
                    );
                }
            }
        }

        resolveTransactionUser();

        return () => {
            cancelled = true;
        };
    }, [
        isAdmin,
        authLoading,
        user?.email,
        router,
    ]);

    /* =====================================================
       LOAD SAVED DATA
    ===================================================== */

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        let cancelled = false;

        const controller = new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, 15000);

        async function loadData() {
            try {
                setLoading(true);

                const [
                    partyRes,
                    transactionRes,
                    adminRes,
                    ebratdaRes,
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
                        `${API_BASE}/ebratdapdf/buyer-termination/user/${id}`,
                        {
                            signal: controller.signal,
                        }
                    ),
                ]);

                const parseJSON = async (
                    response: Response
                ) => {
                    try {
                        return await response.json();
                    } catch {
                        throw new Error(
                            "Invalid server response."
                        );
                    }
                };

                const [
                    partysettingsJson,
                    transactionJson,
                    adminJson,
                    ebratdaJson,
                ] = await Promise.all([
                    parseJSON(partyRes),
                    parseJSON(transactionRes),
                    parseJSON(adminRes),
                    parseJSON(ebratdaRes),
                ]);

                if (
                    !partyRes.ok ||
                    !transactionRes.ok ||
                    !adminRes.ok ||
                    !ebratdaRes.ok
                ) {
                    throw new Error(
                        "Failed to load data."
                    );
                }

                const partysettings =
                    partysettingsJson?.data || {};

                const transactionsettings =
                    transactionJson?.data || {};

                const settings =
                    adminJson?.data || {};

                const cleanData =
                    ebratdaJson?.data || {};

                /* =========================================
                   IDENTITY
                ========================================= */

                const passport =
                    partysettings
                        ?.identityData
                        ?.passport
                        ?.fullName
                        ? partysettings.identityData.passport
                        : null;

                const license =
                    partysettings
                        ?.identityData
                        ?.license
                        ?.fullName
                        ? partysettings.identityData.license
                        : null;

                const buyerFullName =
                    passport?.fullName ||
                    license?.fullName ||
                    partysettings?.name ||
                    "";

                if (cancelled) return;

                setFormData((prev) => ({
                    ...prev,

                    buyerName1:
                        cleanData?.buyerName1 ||
                        prev.buyerName1 ||
                        buyerFullName,

                    buyerPrint1:
                        cleanData?.buyerPrint1 ||
                        prev.buyerPrint1 ||
                        buyerFullName,

                    buyerName2:
                        cleanData?.buyerName2 ||
                        prev.buyerName2 ||
                        "",

                    buyerPrint2:
                        cleanData?.buyerPrint2 ||
                        prev.buyerPrint2 ||
                        "",

                    buyerEmail1:
                        cleanData?.buyerEmail1 ||
                        prev.buyerEmail1 ||
                        partysettings?.email ||
                        "",

                    buyerEmail2:
                        cleanData?.buyerEmail2 ||
                        prev.buyerEmail2 ||
                        "",

                    agreementNumber:
                        cleanData?.agreementNumber ||
                        prev.agreementNumber ||
                        transactionsettings?.agreementnumber ||
                        "",

                    terminateAgreement:
                        cleanData?.terminateAgreement ||
                        prev.terminateAgreement ||
                        transactionsettings?.agreementnumber ||
                        "",

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

                    brokerPrint:
                        cleanData?.brokerPrint ||
                        prev.brokerPrint ||
                        settings?.repName ||
                        "",

                    brokerEmail:
                        cleanData?.brokerEmail ||
                        prev.brokerEmail ||
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

                    ...cleanData,
                }));
            } catch (error: any) {
                console.error(
                    "EBRATDA LOAD ERROR:",
                    error
                );

                if (cancelled) return;

                if (
                    error?.name ===
                    "AbortError"
                ) {
                    Alert.alert(
                        "Timeout",
                        "The request timed out while loading the termination agreement."
                    );
                } else {
                    Alert.alert(
                        "Load Error",
                        error?.message ||
                            "Failed to load agreement data."
                    );
                }
            } finally {
                clearTimeout(timeout);

                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadData();

        return () => {
            cancelled = true;
            controller.abort();
            clearTimeout(timeout);
        };
    }, [id]);

    /* =====================================================
       DATE
    ===================================================== */

    const openTerminationDate = () => {
        setShowTerminationDatePicker(true);
    };

    const openTerminationTime = () => {
        setShowTerminationTimePicker(true);
    };

    /* =====================================================
       SUBMIT
    ===================================================== */

    const handleSubmit = async () => {
        if (!id) {
            Alert.alert(
                "Error",
                "Party not found."
            );
            return;
        }

        if (isAdmin && !transactionUserId) {
            Alert.alert(
                "Authentication",
                "Transaction admin authentication is not ready yet."
            );
            return;
        }

        try {
            setSaving(true);

            const payload = {
                ...formData,

                // Website behavior:
                // signatures are generated from buyer names.
                buyerPrint1: formData.buyerName1,
                buyerPrint2: formData.buyerName2,

                partyId: id,
                sendEmail: false,
                isAdmin,
            };

            const controller =
                new AbortController();

            const timeout = setTimeout(() => {
                controller.abort();
            }, 20000);

            const response = await fetch(
                `${API_BASE}/ebratdapdf/generate-buyer-termination`,
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
                    // Ignore invalid error response.
                }

                throw new Error(message);
            }

            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";

            /* =============================================
               ADMIN → PDF
            ============================================= */

            if (
                contentType.includes(
                    "application/pdf"
                )
            ) {
                await response.arrayBuffer();

                Alert.alert(
                    "Success",
                    "Buyer Representation Termination updated successfully."
                );

                return;
            }

            /* =============================================
               NORMAL USER → JSON
            ============================================= */

            let data: any = null;

            try {
                data = await response.json();
            } catch {
                throw new Error(
                    "Invalid server response."
                );
            }

            Alert.alert(
                "Success",
                data?.message ||
                    "Buyer Representation Termination saved successfully."
            );
        } catch (error: any) {
            console.error(
                "EBRATDA SUBMIT ERROR:",
                error
            );

            if (
                error?.name ===
                "AbortError"
            ) {
                Alert.alert(
                    "Timeout",
                    "The request timed out."
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

    /* =====================================================
       AUTH / LOADING
    ===================================================== */

    if (
        authLoading ||
        (isAdmin &&
            checkingTransactionAuth)
    ) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50 px-6">
                <View className="items-center rounded-2xl bg-white p-6">
                    <Ionicons
                        name="shield-checkmark-outline"
                        size={34}
                        color="#2563eb"
                    />

                    <Text className="mt-3 text-base font-semibold text-gray-800">
                        Checking transaction access...
                    </Text>

                    <Text className="mt-1 text-center text-sm text-gray-500">
                        Please wait while your admin access is verified.
                    </Text>
                </View>
            </View>
        );
    }

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50 px-6">
                <Ionicons
                    name="document-text-outline"
                    size={34}
                    color="#2563eb"
                />

                <Text className="mt-3 text-base font-semibold text-gray-800">
                    Loading termination agreement...
                </Text>

                <Text className="mt-1 text-center text-sm text-gray-500">
                    Loading saved EBRATDA information.
                </Text>
            </View>
        );
    }

    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <View className="flex-1 bg-gray-50">
            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                    padding: 16,
                    paddingBottom: 40,
                }}
            >
                {/* =========================================
                    ADMIN MODE
                ========================================= */}

                {/* {isAdmin ? (
                    <View className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
                        <View className="flex-row items-center">
                            <Ionicons
                                name="shield-checkmark"
                                size={19}
                                color="#2563eb"
                            />

                            <Text className="ml-2 text-sm font-semibold text-blue-700">
                                Admin Mode
                            </Text>
                        </View>

                        <Text className="mt-1 text-xs text-blue-600">
                            You can edit the agreement but cannot change the workflow.
                        </Text>
                    </View>
                ) : null} */}

                {/* =========================================
                    TITLE
                ========================================= */}

                <View className="mb-5">
                    <Text className="text-center text-2xl font-bold text-gray-800">
                        Buyer Representation
                        {"\n"}
                        Termination
                    </Text>

                    <Text className="mt-2 text-center text-sm text-gray-500">
                        Exclusive Buyer Representation Agreement Termination
                    </Text>
                </View>

                {/* =========================================
                    BROKERAGE
                ========================================= */}

                <Card>
                    <SectionTitle
                        title="THE BROKERAGE (WE)"
                    />

                    <Field
                        label="Agreement Number"
                        value={
                            formData.agreementNumber
                        }
                        onChangeText={(value) =>
                            updateField(
                                "agreementNumber",
                                value
                            )
                        }
                        placeholder="Agreement Number"
                    />

                    <Field
                        label="Brokerage Name"
                        value={
                            formData.brokerageName1
                        }
                        onChangeText={(value) =>
                            updateField(
                                "brokerageName1",
                                value
                            )
                        }
                        placeholder="Brokerage Name"
                        maxLength={100}
                    />

                    <Field
                        label="Brokerage Representative"
                        value={
                            formData.brokerageName2
                        }
                        onChangeText={(value) =>
                            updateField(
                                "brokerageName2",
                                value
                            )
                        }
                        placeholder="Representative Name"
                        maxLength={100}
                    />
                </Card>

                {/* =========================================
                    BUYER
                ========================================= */}

                <Card>
                    <SectionTitle
                        title="THE BUYER (YOU)"
                    />

                    <Field
                        label="Buyer Name"
                        value={
                            formData.buyerName1
                        }
                        onChangeText={(value) =>
                            updateField(
                                "buyerName1",
                                value
                            )
                        }
                        placeholder="Buyer Name"
                        maxLength={80}
                    />

                    <Field
                        label="Buyer Name (Optional)"
                        value={
                            formData.buyerName2
                        }
                        onChangeText={(value) =>
                            updateField(
                                "buyerName2",
                                value
                            )
                        }
                        placeholder="Buyer Name"
                        maxLength={80}
                    />
                </Card>

                {/* =========================================
                    TERMINATION
                ========================================= */}

                <Card>
                    <SectionTitle
                        title="Agreement Termination"
                    />

                    <Field
                        label="Agreement Number Being Terminated"
                        value={
                            formData.terminateAgreement
                        }
                        onChangeText={(value) =>
                            updateField(
                                "terminateAgreement",
                                value
                            )
                        }
                        placeholder="Agreement #"
                        maxLength={40}
                    />

                    {/* TIME */}

                    <View className="mb-4">
                        <Text className="mb-1.5 text-sm font-medium text-gray-700">
                            Termination Time
                        </Text>

                        <Pressable
                            onPress={
                                openTerminationTime
                            }
                            className="h-12 flex-row items-center rounded-xl border border-gray-200 bg-white px-4"
                        >
                            <Ionicons
                                name="time-outline"
                                size={19}
                                color="#6b7280"
                            />

                            <Text className="ml-3 text-sm text-gray-800">
                                {formData.terminationTime ||
                                    "Select termination time"}
                            </Text>
                        </Pressable>
                    </View>

                    {showTerminationTimePicker ? (
                        <DateTimePicker
                            value={parseDate(
                                formData.terminationTime
                            )}
                            mode="time"
                            display="default"
                            onChange={(
                                event,
                                selectedDate
                            ) => {
                                setShowTerminationTimePicker(
                                    false
                                );

                                if (
                                    event.type ===
                                        "dismissed" ||
                                    !selectedDate
                                ) {
                                    return;
                                }

                                updateField(
                                    "terminationTime",
                                    formatTimeForAPI(
                                        selectedDate
                                    )
                                );
                            }}
                        />
                    ) : null}

                    {/* DATE */}

                    <View className="mb-2">
                        <Text className="mb-1.5 text-sm font-medium text-gray-700">
                            Termination Date
                        </Text>

                        <Pressable
                            onPress={
                                openTerminationDate
                            }
                            className="h-12 flex-row items-center rounded-xl border border-gray-200 bg-white px-4"
                        >
                            <Ionicons
                                name="calendar-outline"
                                size={19}
                                color="#6b7280"
                            />

                            <Text className="ml-3 text-sm text-gray-800">
                                {formData.terminationDate ||
                                    "Select termination date"}
                            </Text>
                        </Pressable>
                    </View>

                    {showTerminationDatePicker ? (
                        <DateTimePicker
                            value={parseDate(
                                formData.terminationDate
                            )}
                            mode="date"
                            display="default"
                            onChange={(
                                event,
                                selectedDate
                            ) => {
                                setShowTerminationDatePicker(
                                    false
                                );

                                if (
                                    event.type ===
                                        "dismissed" ||
                                    !selectedDate
                                ) {
                                    return;
                                }

                                updateField(
                                    "terminationDate",
                                    formatDateForAPI(
                                        selectedDate
                                    )
                                );
                            }}
                        />
                    ) : null}
                </Card>

                {/* =========================================
                    TERMINATION TYPE
                ========================================= */}

                <Card>
                    <SectionTitle
                        title="Termination Type"
                    />

                    <RadioOption
                        selected={
                            formData.terminationType ===
                            "unconditional"
                        }
                        label="Unconditional Termination"
                        onPress={() =>
                            updateField(
                                "terminationType",
                                "unconditional"
                            )
                        }
                    />

                    <RadioOption
                        selected={
                            formData.terminationType ===
                            "conditional"
                        }
                        label="Conditional Termination"
                        onPress={() =>
                            updateField(
                                "terminationType",
                                "conditional"
                            )
                        }
                    />

                    <Field
                        label="Additional Terms"
                        value={
                            formData.additionalTerms
                        }
                        onChangeText={(value) =>
                            updateField(
                                "additionalTerms",
                                value
                            )
                        }
                        placeholder="Additional terms"
                        maxLength={500}
                        multiline
                    />
                </Card>

                {/* =========================================
                    SIGNATURES
                ========================================= */}

                <Card>
                    <SectionTitle
                        title="SIGNATURES"
                    />

                    {/* BUYER 1 */}

                    <View className="mb-5">
                        <Text className="mb-3 text-base font-bold text-gray-800">
                            Buyer 1
                        </Text>

                        <View className="mb-3 rounded-xl border border-gray-200 bg-gray-100 p-3">
                            <Text className="text-xs text-gray-500">
                                Signature
                            </Text>

                            <Text className="mt-1 text-sm italic text-gray-400">
                                Signature of Buyer
                            </Text>
                        </View>

                        <Field
                            label="Buyer Name"
                            value={
                                formData.buyerPrint1
                            }
                            onChangeText={(value) =>
                                updateField(
                                    "buyerPrint1",
                                    value
                                )
                            }
                            placeholder="Buyer Name"
                        />

                        <Field
                            label="Buyer Email"
                            value={
                                formData.buyerEmail1
                            }
                            onChangeText={(value) =>
                                updateField(
                                    "buyerEmail1",
                                    value
                                )
                            }
                            placeholder="Buyer Email"
                            keyboardType="email-address"
                        />
                    </View>

                    {/* BUYER 2 */}

                    <View className="mb-5 border-t border-gray-100 pt-5">
                        <Text className="mb-3 text-base font-bold text-gray-800">
                            Buyer 2
                        </Text>

                        <View className="mb-3 rounded-xl border border-gray-200 bg-gray-100 p-3">
                            <Text className="text-xs text-gray-500">
                                Signature
                            </Text>

                            <Text className="mt-1 text-sm italic text-gray-400">
                                Signature of Buyer
                            </Text>
                        </View>

                        <Field
                            label="Buyer Name"
                            value={
                                formData.buyerName2
                            }
                            onChangeText={(value) =>
                                updateField(
                                    "buyerName2",
                                    value
                                )
                            }
                            placeholder="Buyer Name"
                        />

                        {formData.buyerName2.trim() ? (
                            <Field
                                label="Buyer Email"
                                value={
                                    formData.buyerEmail2
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "buyerEmail2",
                                        value
                                    )
                                }
                                placeholder="Buyer 2 Email"
                                keyboardType="email-address"
                            />
                        ) : null}
                    </View>

                    {/* WITNESS 1 */}

                    <View className="mb-5 border-t border-gray-100 pt-5">
                        <Text className="mb-3 text-base font-bold text-gray-800">
                            Witness 1
                        </Text>

                        <View className="mb-3 rounded-xl border border-gray-200 bg-gray-100 p-3">
                            <Text className="text-xs text-gray-500">
                                Signature
                            </Text>

                            <Text className="mt-1 text-sm italic text-gray-400">
                                Witness Signature
                            </Text>
                        </View>

                        <Field
                            label="Witness Name"
                            value={
                                formData.witnessPrint1
                            }
                            onChangeText={(value) =>
                                updateField(
                                    "witnessPrint1",
                                    value
                                )
                            }
                            placeholder="Witness Name"
                        />

                        {formData.witnessPrint1.trim() ? (
                            <Field
                                label="Witness Email"
                                value={
                                    formData.witnessEmail1
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "witnessEmail1",
                                        value
                                    )
                                }
                                placeholder="Witness Email"
                                keyboardType="email-address"
                            />
                        ) : null}
                    </View>

                    {/* WITNESS 2 */}

                    <View className="mb-5 border-t border-gray-100 pt-5">
                        <Text className="mb-3 text-base font-bold text-gray-800">
                            Witness 2
                        </Text>

                        <View className="mb-3 rounded-xl border border-gray-200 bg-gray-100 p-3">
                            <Text className="text-xs text-gray-500">
                                Signature
                            </Text>

                            <Text className="mt-1 text-sm italic text-gray-400">
                                Witness Signature
                            </Text>
                        </View>

                        <Field
                            label="Witness Name"
                            value={
                                formData.witnessPrint2
                            }
                            onChangeText={(value) =>
                                updateField(
                                    "witnessPrint2",
                                    value
                                )
                            }
                            placeholder="Witness Name"
                        />

                        {formData.witnessPrint2.trim() ? (
                            <Field
                                label="Witness Email"
                                value={
                                    formData.witnessEmail2
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "witnessEmail2",
                                        value
                                    )
                                }
                                placeholder="Witness 2 Email"
                                keyboardType="email-address"
                            />
                        ) : null}
                    </View>

                    {/* BROKER */}

                    <View className="border-t border-gray-100 pt-5">
                        <Text className="mb-3 text-base font-bold text-gray-800">
                            Broker
                        </Text>

                        <View className="mb-3 rounded-xl border border-gray-200 bg-gray-100 p-3">
                            <Text className="text-xs text-gray-500">
                                Signature
                            </Text>

                            <Text className="mt-1 text-sm italic text-gray-400">
                                Broker Signature
                            </Text>
                        </View>

                        <Field
                            label="Broker Name"
                            value={
                                formData.brokerPrint
                            }
                            onChangeText={(value) =>
                                updateField(
                                    "brokerPrint",
                                    value
                                )
                            }
                            placeholder="Broker Name"
                        />
                    </View>
                </Card>

                {/* =========================================
                    ADMIN BUTTONS
                ========================================= */}

                {isAdmin ? (
                    <View className="mt-1 border-t border-gray-200 pt-4">
                        <Pressable
                            onPress={() =>
                                router.push(
                                    `/(transactions)/partypdfdata/${id}` as any
                                )
                            }
                            className="mb-3 h-12 flex-row items-center justify-center rounded-xl border border-gray-200 bg-white active:bg-gray-100"
                        >
                            <Ionicons
                                name="document-text-outline"
                                size={19}
                                color="#374151"
                            />

                            <Text className="ml-2 font-semibold text-gray-700">
                                Party Docs List
                            </Text>
                        </Pressable>

                        <Pressable
                            disabled={saving}
                            onPress={handleSubmit}
                            className={[
                                "h-12 flex-row items-center justify-center rounded-xl",
                                saving
                                    ? "bg-gray-400"
                                    : "bg-green-600 active:bg-green-700",
                            ].join(" ")}
                        >
                            <Ionicons
                                name={
                                    saving
                                        ? "hourglass-outline"
                                        : "save-outline"
                                }
                                size={19}
                                color="#ffffff"
                            />

                            <Text className="ml-2 font-semibold text-white">
                                {saving
                                    ? "Saving..."
                                    : "Save"}
                            </Text>
                        </Pressable>
                    </View>
                ) : null}
            </ScrollView>
        </View>
    );
}