import React, { useEffect, useMemo, useState } from "react";

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

import DateTimePicker from "@react-native-community/datetimepicker";

import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../../../../contexts/AuthContext";

const API_BASE = "https://realtorparth.ca/api";

type FormData = {
    agreementNumber: string;

    brokerageName1: string;
    brokerageName2: string;

    sellerName1: string;
    sellerName2: string;

    listingNumber: string;
    exclusiveselleragreement: string;

    unitNum: string;
    streetNum: string;
    street: string;
    city: string;
    state: string;
    zipcode: string;

    effectiveTime: string;
    effectiveDate: string;

    endTime: string;
    endDate: string;

    price: string;

    otherAmendments: string;

    signedDate: string;

    sellerPrint1: string;
    sellerPrint2: string;

    witnessPrint1: string;
    witnessPrint2: string;

    repPrintName: string;

    sellerSignatureEmail1: string;
    sellerSignatureEmail2: string;

    witnessEmail1: string;
    witnessEmail2: string;

    brokerEmail: string;
};

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

    sellerName1: "",
    sellerName2: "",

    listingNumber: "",
    exclusiveselleragreement: "",

    unitNum: "",
    streetNum: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",

    effectiveTime: "",
    effectiveDate: "",

    endTime: "",
    endDate: "",

    price: "",

    otherAmendments: "",

    signedDate: "",

    sellerPrint1: "",
    sellerPrint2: "",

    witnessPrint1: "",
    witnessPrint2: "",

    repPrintName: "",

    sellerSignatureEmail1: "",
    sellerSignatureEmail2: "",

    witnessEmail1: "",
    witnessEmail2: "",

    brokerEmail: "",
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

    if (
        typeof user.userId === "string" &&
        user.userId.trim()
    ) {
        return user.userId;
    }

    return null;
};

function pick(...values: any[]) {
    return values.find(
        (value) =>
            value !== undefined &&
            value !== null &&
            value !== ""
    );
}

function formatDateForAPI(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function parseDateValue(value?: string) {
    if (!value) return new Date();

    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
        return parsed;
    }

    return new Date();
}

function formatTimeForAPI(date: Date) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
}

function Field({
    label,
    value,
    onChangeText,
    placeholder,
    maxLength,
    keyboardType = "default",
    multiline = false,
    editable = true,
}: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder?: string;
    maxLength?: number;
    keyboardType?: any;
    multiline?: boolean;
    editable?: boolean;
}) {
    return (
        <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-gray-700">
                {label}
            </Text>

            <TextInput
                value={value ?? ""}
                onChangeText={(text) => {
                    if (
                        maxLength !== undefined &&
                        text.length > maxLength
                    ) {
                        return;
                    }

                    onChangeText(text);
                }}
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                keyboardType={keyboardType}
                multiline={multiline}
                editable={editable}
                textAlignVertical={
                    multiline ? "top" : "center"
                }
                className={`rounded-xl border border-gray-200 bg-white px-4 text-gray-800 ${
                    multiline ? "min-h-[130px] py-3" : "h-12"
                } ${
                    !editable
                        ? "bg-gray-100 text-gray-500"
                        : ""
                }`}
            />

            {maxLength !== undefined && (
                <Text className="mt-1 text-right text-xs text-gray-400">
                    {(value?.length || 0)}/{maxLength}
                </Text>
            )}
        </View>
    );
}

function Section({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <View className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
            <View className="mb-4 border-b border-gray-100 pb-3">
                <Text className="text-lg font-bold text-gray-800">
                    {title}
                </Text>

                {subtitle ? (
                    <Text className="mt-1 text-sm text-gray-500">
                        {subtitle}
                    </Text>
                ) : null}
            </View>

            {children}
        </View>
    );
}

function DisabledSignature({
    label,
}: {
    label: string;
}) {
    return (
        <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-gray-700">
                {label}
            </Text>

            <View className="h-12 flex-row items-center rounded-xl border border-gray-200 bg-gray-100 px-4">
                <Ionicons
                    name="create-outline"
                    size={18}
                    color="#9ca3af"
                />

                <Text className="ml-2 text-sm text-gray-400">
                    Signature will be completed electronically
                </Text>
            </View>
        </View>
    );
}

export default function ESRAAForm() {
    const router = useRouter();

    const { id, mode } =
        useLocalSearchParams<{
            id?: string;
            mode?: string;
        }>();

    const { user } = useAuth();

    const isAdmin = mode === "admin";

    const [checkingTransactionAuth, setCheckingTransactionAuth] =
        useState(isAdmin);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [isSaved, setIsSaved] = useState(false);

    const [transactionUserId, setTransactionUserId] =
        useState<string | null>(null);

    const [formData, setFormData] =
        useState<FormData>(INITIAL_FORM);

    const [datePicker, setDatePicker] = useState<
        "effectiveDate" | "endDate" | "signedDate" | null
    >(null);

    const [timePicker, setTimePicker] = useState<
        "effectiveTime" | "endTime" | null
    >(null);

    const [datePickerValue, setDatePickerValue] =
        useState(new Date());

    const [timePickerValue, setTimePickerValue] =
        useState(new Date());

    const updateField = (
        name: keyof FormData,
        value: string
    ) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    /**
     * ADMIN AUTH BRIDGE
     *
     * Admin mobile login stores admin email.
     * Transaction APIs require the transaction-user ID.
     *
     * Therefore:
     *
     * Admin email
     *      ↓
     * /transactions/check-super-admin/:email
     *      ↓
     * transaction user ID
     */
    useEffect(() => {
        if (!isAdmin) {
            setCheckingTransactionAuth(false);
            return;
        }

        const resolveTransactionUser = async () => {
            try {
                if (!user?.email) {
                    throw new Error(
                        "Admin session not found."
                    );
                }

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
                            "You do not have transaction admin access."
                    );
                }

                const transactionUser =
                    data.user ||
                    data.transactionUser ||
                    data.admin ||
                    data;

                const resolvedId =
                    getTransactionUserId(transactionUser);

                if (!resolvedId) {
                    throw new Error(
                        "Transaction user ID was not returned by the server."
                    );
                }

                setTransactionUserId(resolvedId);
            } catch (error: any) {
                console.error(
                    "TRANSACTION AUTH ERROR:",
                    error
                );

                Alert.alert(
                    "Transaction Access",
                    error?.message ||
                        "Unable to verify transaction access.",
                    [
                        {
                            text: "Go Back",
                            onPress: () => router.back(),
                        },
                    ]
                );
            } finally {
                setCheckingTransactionAuth(false);
            }
        };

        resolveTransactionUser();
    }, [isAdmin, user?.email]);

    /**
     * LOAD FORM DATA
     */
    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        if (isAdmin && !transactionUserId) {
            return;
        }

        const loadData = async () => {
            try {
                setLoading(true);

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
                    esraaRes,
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
                        `${API_BASE}/esraa/user/${id}`,
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
                    partyJson,
                    transactionJson,
                    adminJson,
                    esraaJson,
                ] = await Promise.all([
                    parseJSON(partyRes),
                    parseJSON(transactionRes),
                    parseJSON(adminRes),
                    parseJSON(esraaRes),
                ]);

                if (
                    !partyRes.ok ||
                    !transactionRes.ok ||
                    !adminRes.ok ||
                    !esraaRes.ok
                ) {
                    throw new Error(
                        "Failed to load ESRAA data."
                    );
                }

                const partysettings =
                    partyJson?.data || {};

                const transactionsettings =
                    transactionJson?.data || {};

                const settings =
                    adminJson?.data || {};

                const cleanData =
                    esraaJson?.data || {};

                /**
                 * Identity Data
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

                const sellerFullName =
                    passport?.fullName ||
                    license?.fullName ||
                    partysettings?.name ||
                    "";

                setFormData((prev) => {
                    return {
                        ...INITIAL_FORM,

                        /**
                         * Keep saved ESRAA data first.
                         */
                        ...cleanData,

                        agreementNumber: pick(
                            cleanData?.agreementNumber,
                            prev.agreementNumber,
                            transactionsettings?.agreementnumber,
                            ""
                        ),

                        brokerageName1: pick(
                            cleanData?.brokerageName1,
                            prev.brokerageName1,
                            settings?.brokerageName,
                            ""
                        ),

                        brokerageName2: pick(
                            cleanData?.brokerageName2,
                            prev.brokerageName2,
                            settings?.repName,
                            ""
                        ),

                        repPrintName: pick(
                            cleanData?.repPrintName,
                            prev.repPrintName,
                            settings?.repName,
                            ""
                        ),

                        sellerName1: pick(
                            cleanData?.sellerName1,
                            prev.sellerName1,
                            sellerFullName,
                            ""
                        ),

                        sellerName2: pick(
                            cleanData?.sellerName2,
                            prev.sellerName2,
                            ""
                        ),

                        sellerPrint1: pick(
                            cleanData?.sellerPrint1,
                            prev.sellerPrint1,
                            sellerFullName,
                            ""
                        ),

                        sellerPrint2: pick(
                            cleanData?.sellerPrint2,
                            prev.sellerPrint2,
                            cleanData?.sellerName2,
                            ""
                        ),

                        exclusiveselleragreement:
                            pick(
                                cleanData?.exclusiveselleragreement,
                                prev.exclusiveselleragreement,
                                transactionsettings?.agreementnumber,
                                ""
                            ),

                        sellerSignatureEmail1:
                            pick(
                                cleanData?.sellerSignatureEmail1,
                                prev.sellerSignatureEmail1,
                                partysettings?.email,
                                ""
                            ),

                        sellerSignatureEmail2:
                            pick(
                                cleanData?.sellerSignatureEmail2,
                                prev.sellerSignatureEmail2,
                                ""
                            ),

                        witnessEmail1: pick(
                            cleanData?.witnessEmail1,
                            prev.witnessEmail1,
                            ""
                        ),

                        witnessEmail2: pick(
                            cleanData?.witnessEmail2,
                            prev.witnessEmail2,
                            ""
                        ),

                        brokerEmail: pick(
                            cleanData?.brokerEmail,
                            prev.brokerEmail,
                            settings?.repEmail,
                            ""
                        ),
                    };
                });

                if (esraaJson?.data) {
                    setIsSaved(true);
                }
            } catch (error: any) {
                console.error(
                    "ESRAA LOAD ERROR:",
                    error
                );

                if (
                    error?.name === "AbortError"
                ) {
                    Alert.alert(
                        "Timeout",
                        "Request timed out."
                    );
                } else if (
                    error?.name === "TypeError"
                ) {
                    Alert.alert(
                        "Network Error",
                        "Server is down or there is a network problem."
                    );
                } else {
                    Alert.alert(
                        "Error",
                        error?.message ||
                            "Failed to load ESRAA data."
                    );
                }
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, isAdmin, transactionUserId]);

    /**
     * DATE PICKER
     */
    const openDatePicker = (
        field:
            | "effectiveDate"
            | "endDate"
            | "signedDate"
    ) => {
        setDatePickerValue(
            parseDateValue(
                formData[field]
            )
        );

        setDatePicker(field);
    };

    const openTimePicker = (
        field: "effectiveTime" | "endTime"
    ) => {
        const existing =
            formData[field];

        if (existing) {
            const [hours, minutes] =
                existing.split(":");

            const date = new Date();

            if (
                hours !== undefined &&
                minutes !== undefined
            ) {
                date.setHours(
                    Number(hours)
                );
                date.setMinutes(
                    Number(minutes)
                );
            }

            setTimePickerValue(date);
        } else {
            setTimePickerValue(
                new Date()
            );
        }

        setTimePicker(field);
    };

    const handleDateChange = (
        event: any,
        selectedDate?: Date
    ) => {
        if (Platform.OS === "android") {
            setDatePicker(null);
        }

        if (!selectedDate || !datePicker) {
            return;
        }

        updateField(
            datePicker,
            formatDateForAPI(selectedDate)
        );

        if (Platform.OS === "ios") {
            setDatePickerValue(
                selectedDate
            );
        }
    };

    const handleTimeChange = (
        event: any,
        selectedTime?: Date
    ) => {
        if (Platform.OS === "android") {
            setTimePicker(null);
        }

        if (!selectedTime || !timePicker) {
            return;
        }

        updateField(
            timePicker,
            formatTimeForAPI(
                selectedTime
            )
        );

        if (Platform.OS === "ios") {
            setTimePickerValue(
                selectedTime
            );
        }
    };

    /**
     * SUBMIT
     */
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

            const timeout = setTimeout(
                () => controller.abort(),
                20000
            );

            const response = await fetch(
                `${API_BASE}/esraa/generate-pdf`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify(
                        payload
                    ),

                    signal: controller.signal,
                }
            );

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(
                    "Request failed."
                );
            }

            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";

            /**
             * ADMIN → PDF response
             */
            if (
                contentType.includes(
                    "application/pdf"
                )
            ) {
                await response.arrayBuffer();

                setIsSaved(true);

                Alert.alert(
                    "Success",
                    "ESRAA updated successfully ✅"
                );

                return;
            }

            /**
             * NORMAL USER → JSON
             */
            let data: any;

            try {
                data = await response.json();
            } catch {
                throw new Error(
                    "Invalid server response."
                );
            }

            setIsSaved(true);

            Alert.alert(
                "Success",
                "Exclusive Seller Representation Agreement Amendment saved ✅"
            );
        } catch (error: any) {
            console.error(
                "ESRAA SUBMIT ERROR:",
                error
            );

            if (
                error?.name ===
                "AbortError"
            ) {
                Alert.alert(
                    "Timeout",
                    "Request timed out."
                );
            } else if (
                error?.name ===
                "TypeError"
            ) {
                Alert.alert(
                    "Network Error",
                    "Server is down or there is a network problem."
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

    /**
     * DATE FIELD COMPONENT
     */
    const DateField = ({
        label,
        field,
    }: {
        label: string;
        field:
            | "effectiveDate"
            | "endDate"
            | "signedDate";
    }) => {
        return (
            <View className="mb-4">
                <Text className="mb-2 text-sm font-semibold text-gray-700">
                    {label}
                </Text>

                <Pressable
                    onPress={() =>
                        openDatePicker(field)
                    }
                    className="h-12 flex-row items-center rounded-xl border border-gray-200 bg-white px-4"
                >
                    <Ionicons
                        name="calendar-outline"
                        size={19}
                        color="#6b7280"
                    />

                    <Text
                        className={`ml-3 flex-1 ${
                            formData[field]
                                ? "text-gray-800"
                                : "text-gray-400"
                        }`}
                    >
                        {formData[field] ||
                            "Select date"}
                    </Text>
                </Pressable>
            </View>
        );
    };

    /**
     * TIME FIELD COMPONENT
     */
    const TimeField = ({
        label,
        field,
    }: {
        label: string;
        field:
            | "effectiveTime"
            | "endTime";
    }) => {
        return (
            <View className="mb-4">
                <Text className="mb-2 text-sm font-semibold text-gray-700">
                    {label}
                </Text>

                <Pressable
                    onPress={() =>
                        openTimePicker(field)
                    }
                    className="h-12 flex-row items-center rounded-xl border border-gray-200 bg-white px-4"
                >
                    <Ionicons
                        name="time-outline"
                        size={19}
                        color="#6b7280"
                    />

                    <Text
                        className={`ml-3 flex-1 ${
                            formData[field]
                                ? "text-gray-800"
                                : "text-gray-400"
                        }`}
                    >
                        {formData[field] ||
                            "Select time"}
                    </Text>
                </Pressable>
            </View>
        );
    };

    /**
     * SIGNATURE SELLER BLOCK
     */
    const SellerSignatureBlock = ({
        sellerNumber,
    }: {
        sellerNumber: 1 | 2;
    }) => {
        const nameField =
            sellerNumber === 1
                ? "sellerName1"
                : "sellerName2";

        const emailField =
            sellerNumber === 1
                ? "sellerSignatureEmail1"
                : "sellerSignatureEmail2";

        const witnessNameField =
            sellerNumber === 1
                ? "witnessPrint1"
                : "witnessPrint2";

        const witnessEmailField =
            sellerNumber === 1
                ? "witnessEmail1"
                : "witnessEmail2";

        const sellerName =
            formData[nameField];

        return (
            <View className="mb-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <Text className="mb-4 text-base font-bold text-gray-800">
                    Seller {sellerNumber}
                </Text>

                <DisabledSignature
                    label="Signature of Seller"
                />

                <Field
                    label="Print Name of Seller"
                    value={sellerName}
                    placeholder="Print Name of Seller"
                    maxLength={80}
                    onChangeText={(value) =>
                        updateField(
                            nameField,
                            value
                        )
                    }
                />

                {sellerName?.trim() ? (
                    <Field
                        label="Seller Email"
                        value={
                            formData[
                                emailField
                            ]
                        }
                        placeholder="Seller Email"
                        keyboardType="email-address"
                        onChangeText={(value) =>
                            updateField(
                                emailField,
                                value
                            )
                        }
                    />
                ) : null}

                <DisabledSignature
                    label="Signature of Witness"
                />

                <Field
                    label="Print Name of Witness"
                    value={
                        formData[
                            witnessNameField
                        ]
                    }
                    placeholder="Print Name of Witness"
                    maxLength={80}
                    onChangeText={(value) =>
                        updateField(
                            witnessNameField,
                            value
                        )
                    }
                />

                {formData[
                    witnessNameField
                ]?.trim() ? (
                    <Field
                        label="Witness Email"
                        value={
                            formData[
                                witnessEmailField
                            ]
                        }
                        placeholder="Witness Email"
                        keyboardType="email-address"
                        onChangeText={(value) =>
                            updateField(
                                witnessEmailField,
                                value
                            )
                        }
                    />
                ) : null}
            </View>
        );
    };

    /**
     * LOADING
     */
    if (
        checkingTransactionAuth ||
        loading
    ) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50 px-6">
                <ActivityIndicator
                    size="large"
                    color="#2563eb"
                />

                <Text className="mt-4 text-center text-sm text-gray-500">
                    {checkingTransactionAuth
                        ? "Checking transaction authentication..."
                        : "Loading ESRAA form..."}
                </Text>
            </View>
        );
    }

    /**
     * MAIN UI
     */
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
                showsVerticalScrollIndicator={false}
            >
                {/* HEADER */}
                <View className="mb-5 flex-row items-start">
                    

                    <View className="flex-1">
                        <Text className="text-2xl font-bold text-gray-800">
                            Exclusive Seller Representation Agreement Amendment
                        </Text>

                        <Text className="mt-1 text-sm text-gray-500">
                            Complete the amendment information below.
                        </Text>
                    </View>
                </View>

                {/* ADMIN BANNER */}
                {/* {isAdmin && (
                    <View className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                        <View className="flex-row items-center">
                            <Ionicons
                                name="shield-checkmark-outline"
                                size={20}
                                color="#2563eb"
                            />

                            <Text className="ml-2 text-sm font-semibold text-blue-700">
                                Admin Mode
                            </Text>
                        </View>

                        <Text className="mt-1 text-xs text-blue-600">
                            You can edit the form but cannot change the workflow.
                        </Text>
                    </View>
                )} */}

                {/* AGREEMENT */}
                <Section title="Agreement">
                    <Field
                        label="Agreement Number"
                        value={
                            formData.agreementNumber
                        }
                        placeholder="Agreement Number"
                        maxLength={40}
                        onChangeText={(value) =>
                            updateField(
                                "agreementNumber",
                                value
                            )
                        }
                    />
                </Section>

                {/* BROKERAGE */}
                <Section title="THE BROKERAGE (WE)">
                    <Field
                        label="Brokerage Name"
                        value={
                            formData.brokerageName1
                        }
                        editable={false}
                        maxLength={100}
                        onChangeText={() => {}}
                    />

                    <Field
                        label="Brokerage Representative Name"
                        value={
                            formData.brokerageName2
                        }
                        placeholder="Name"
                        maxLength={100}
                        onChangeText={(value) =>
                            updateField(
                                "brokerageName2",
                                value
                            )
                        }
                    />
                </Section>

                {/* SELLER */}
                <Section title="THE SELLER (YOU)">
                    <Field
                        label="Seller Name"
                        value={
                            formData.sellerName1
                        }
                        placeholder="Name"
                        maxLength={80}
                        onChangeText={(value) =>
                            updateField(
                                "sellerName1",
                                value
                            )
                        }
                    />

                    <Field
                        label="Seller Name 2"
                        value={
                            formData.sellerName2
                        }
                        placeholder="Name"
                        maxLength={80}
                        onChangeText={(value) =>
                            updateField(
                                "sellerName2",
                                value
                            )
                        }
                    />
                </Section>

                {/* LISTING + AGREEMENT */}
                <Section title="Listing & Agreement">
                    <Field
                        label="Listing Number"
                        value={
                            formData.listingNumber
                        }
                        placeholder="Listing Number"
                        maxLength={10}
                        onChangeText={(value) =>
                            updateField(
                                "listingNumber",
                                value
                            )
                        }
                    />

                    <Field
                        label="Exclusive Seller Representation Agreement #"
                        value={
                            formData.exclusiveselleragreement
                        }
                        placeholder="Agreement Number"
                        maxLength={40}
                        onChangeText={(value) =>
                            updateField(
                                "exclusiveselleragreement",
                                value
                            )
                        }
                    />
                </Section>

                {/* PROPERTY */}
                <Section
                    title="Property"
                    subtitle="Municipal address or legal description"
                >
                    <Field
                        label="Unit Number"
                        value={
                            formData.unitNum
                        }
                        placeholder="Unit Number"
                        maxLength={10}
                        onChangeText={(value) =>
                            updateField(
                                "unitNum",
                                value
                            )
                        }
                    />

                    <Field
                        label="Street Number"
                        value={
                            formData.streetNum
                        }
                        placeholder="Street Number"
                        maxLength={10}
                        onChangeText={(value) =>
                            updateField(
                                "streetNum",
                                value
                            )
                        }
                    />

                    <Field
                        label="Street"
                        value={
                            formData.street
                        }
                        placeholder="Street"
                        maxLength={60}
                        onChangeText={(value) =>
                            updateField(
                                "street",
                                value
                            )
                        }
                    />

                    <Field
                        label="City"
                        value={
                            formData.city
                        }
                        placeholder="City"
                        maxLength={40}
                        onChangeText={(value) =>
                            updateField(
                                "city",
                                value
                            )
                        }
                    />

                    <Field
                        label="State"
                        value={
                            formData.state
                        }
                        placeholder="State"
                        maxLength={2}
                        onChangeText={(value) =>
                            updateField(
                                "state",
                                value
                            )
                        }
                    />

                    <Field
                        label="Zip Code"
                        value={
                            formData.zipcode
                        }
                        placeholder="Zip Code"
                        maxLength={10}
                        onChangeText={(value) =>
                            updateField(
                                "zipcode",
                                value
                            )
                        }
                    />
                </Section>

                {/* EFFECTIVE DATE */}
                <Section title="Amendment Effective Time & Date">
                    <TimeField
                        label="Effective Time"
                        field="effectiveTime"
                    />

                    <DateField
                        label="Effective Date"
                        field="effectiveDate"
                    />
                </Section>

                {/* END DATE */}
                <Section title="1. End Time & Date">
                    <TimeField
                        label="End Time"
                        field="endTime"
                    />

                    <DateField
                        label="End Date"
                        field="endDate"
                    />
                </Section>

                {/* PRICE */}
                <Section title="2. Price Change">
                    <Field
                        label="New Asking Price"
                        value={
                            formData.price
                        }
                        placeholder="New Asking Price"
                        maxLength={16}
                        onChangeText={(value) =>
                            updateField(
                                "price",
                                value
                            )
                        }
                    />
                </Section>

                {/* OTHER AMENDMENTS */}
                <Section title="3. Other Amendments">
                    <Field
                        label="Other Amendments"
                        value={
                            formData.otherAmendments
                        }
                        placeholder="Enter other amendments..."
                        maxLength={1000}
                        multiline
                        onChangeText={(value) =>
                            updateField(
                                "otherAmendments",
                                value
                            )
                        }
                    />
                </Section>

                {/* SIGNATURES */}
                <Section title="Signatures">
                    <SellerSignatureBlock
                        sellerNumber={1}
                    />

                    <SellerSignatureBlock
                        sellerNumber={2}
                    />

                    {/* BROKERAGE REPRESENTATIVE */}
                    <View className="mt-1">
                        <DisabledSignature
                            label="Signature of Brokerage Representative"
                        />

                        <Field
                            label="Print Name of Brokerage Representative"
                            value={
                                formData.repPrintName
                            }
                            placeholder="Print Name of Brokerage Representative"
                            onChangeText={(value) =>
                                updateField(
                                    "repPrintName",
                                    value
                                )
                            }
                        />
                    </View>
                </Section>

                {/* SIGNED DATE */}
                <Section title="Signing Information">
                    <DateField
                        label="Signed Date"
                        field="signedDate"
                    />

                    <Field
                        label="Broker Email"
                        value={
                            formData.brokerEmail
                        }
                        placeholder="Broker Email"
                        keyboardType="email-address"
                        onChangeText={(value) =>
                            updateField(
                                "brokerEmail",
                                value
                            )
                        }
                    />
                </Section>

                {/* STATUS */}
                {isSaved && (
                    <View className="mb-5 flex-row items-center rounded-xl border border-green-200 bg-green-50 p-4">
                        <Ionicons
                            name="checkmark-circle"
                            size={21}
                            color="#16a34a"
                        />

                        <Text className="ml-2 text-sm font-semibold text-green-700">
                            ESRAA has been saved.
                        </Text>
                    </View>
                )}

                {/* ADMIN BUTTONS */}
                {isAdmin && (
                    <View className="border-t border-gray-200 pt-5">
                        <Pressable
                            onPress={() =>
                                router.push(
                                    `/(transactions)/partypdfdata/${id}` as any
                                )
                            }
                            className="mb-3 h-12 flex-row items-center justify-center rounded-xl border border-gray-200 bg-white"
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
                            onPress={() =>
                                handleSubmit(false)
                            }
                            className={`h-12 flex-row items-center justify-center rounded-xl ${
                                saving
                                    ? "bg-green-300"
                                    : "bg-green-600"
                            }`}
                        >
                            {saving ? (
                                <ActivityIndicator
                                    color="#ffffff"
                                />
                            ) : (
                                <>
                                    <Ionicons
                                        name="save-outline"
                                        size={19}
                                        color="#ffffff"
                                    />

                                    <Text className="ml-2 font-semibold text-white">
                                        Save
                                    </Text>
                                </>
                            )}
                        </Pressable>
                    </View>
                )}
            </ScrollView>

            {/* DATE PICKER */}
            {datePicker && (
                <DateTimePicker
                    value={
                        datePickerValue
                    }
                    mode="date"
                    display={
                        Platform.OS === "ios"
                            ? "spinner"
                            : "default"
                    }
                    onChange={
                        handleDateChange
                    }
                />
            )}

            {/* TIME PICKER */}
            {timePicker && (
                <DateTimePicker
                    value={
                        timePickerValue
                    }
                    mode="time"
                    display={
                        Platform.OS === "ios"
                            ? "spinner"
                            : "default"
                    }
                    onChange={
                        handleTimeChange
                    }
                />
            )}
        </KeyboardAvoidingView>
    );
}