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

import {
    useLocalSearchParams,
    useRouter,
} from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import DateTimePicker from "@react-native-community/datetimepicker";

import { useAuth } from "../../../../../contexts/AuthContext";

const API_BASE = "https://realtorparth.ca/api";

type FormData = {
    agreementNumber: string;

    brokerageName1: string;
    brokerageName2: string;

    sellerName1: string;
    sellerName2: string;

    propertyUnitNumber: string;
    streetNumber: string;
    street: string;
    city: string;
    state: string;
    zipcode: string;

    plan: string;
    block: string;
    lot: string;

    condoPlan: string;
    unitNumber: string;

    meridian: string;
    range: string;
    township: string;
    section: string;

    feeAmount: string;
    feeDays1: string;
    feeDays2: string;

    married: string;
    resided: string;

    seller1Name: string;
    seller1Streetnum: string;
    seller1Street: string;
    seller1City: string;
    seller1State: string;
    seller1Zipcode: string;
    seller1Phone: string;
    seller1Fax: string;
    seller1Email: string;

    seller2Name: string;
    seller2Streetnum: string;
    seller2Street: string;
    seller2City: string;
    seller2State: string;
    seller2Zipcode: string;
    seller2Phone: string;
    seller2Fax: string;
    seller2Email: string;

    brokerageName: string;
    brokerageAddress: string;
    brokeragePhone: string;
    brokerageFax: string;
    brokerageEmail: string;

    repName: string;
    repAddress: string;
    repPhone: string;
    repFax: string;
    repEmail: string;

    signedDate: string;

    sellerPrint1: string;
    sellerSignatureEmail1: string;

    sellerPrint2: string;
    sellerSignatureEmail2: string;

    witnessPrint1: string;
    witnessEmail1: string;

    witnessPrint2: string;
    witnessEmail2: string;

    repPrintName: string;
    repSignatureEmail: string;

    spouseLocation: string;
    spouseTime: string;
    spouseDate: string;

    spouseName: string;
    spouseSignatureEmail: string;

    spouseWitnessName: string;
    spouseWitnessEmail: string;
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

    propertyUnitNumber: "",
    streetNumber: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",

    plan: "",
    block: "",
    lot: "",

    condoPlan: "",
    unitNumber: "",

    meridian: "",
    range: "",
    township: "",
    section: "",

    feeAmount: "",
    feeDays1: "",
    feeDays2: "",

    married: "",
    resided: "",

    seller1Name: "",
    seller1Streetnum: "",
    seller1Street: "",
    seller1City: "",
    seller1State: "",
    seller1Zipcode: "",
    seller1Phone: "",
    seller1Fax: "",
    seller1Email: "",

    seller2Name: "",
    seller2Streetnum: "",
    seller2Street: "",
    seller2City: "",
    seller2State: "",
    seller2Zipcode: "",
    seller2Phone: "",
    seller2Fax: "",
    seller2Email: "",

    brokerageName: "",
    brokerageAddress: "",
    brokeragePhone: "",
    brokerageFax: "",
    brokerageEmail: "",

    repName: "",
    repAddress: "",
    repPhone: "",
    repFax: "",
    repEmail: "",

    signedDate: "",

    sellerPrint1: "",
    sellerSignatureEmail1: "",

    sellerPrint2: "",
    sellerSignatureEmail2: "",

    witnessPrint1: "",
    witnessEmail1: "",

    witnessPrint2: "",
    witnessEmail2: "",

    repPrintName: "",
    repSignatureEmail: "",

    spouseLocation: "",
    spouseTime: "",
    spouseDate: "",

    spouseName: "",
    spouseSignatureEmail: "",

    spouseWitnessName: "",
    spouseWitnessEmail: "",
};

const getTransactionUserId = (
    user: TransactionUser | null
): string | null => {
    if (!user) return null;

    if (
        typeof user.id === "string" &&
        user.id.trim()
    ) {
        return user.id;
    }

    if (
        typeof user._id === "string" &&
        user._id.trim()
    ) {
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

const pick = (...values: any[]) =>
    values.find(
        (value) =>
            value !== undefined &&
            value !== null &&
            value !== ""
    );

const formatDate = (date: Date) => {
    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const parseDate = (value?: string) => {
    if (!value) {
        return new Date();
    }

    const parsed = new Date(value);

    return Number.isNaN(parsed.getTime())
        ? new Date()
        : parsed;
};

const formatTime = (date: Date) => {
    const hours = String(
        date.getHours()
    ).padStart(2, "0");

    const minutes = String(
        date.getMinutes()
    ).padStart(2, "0");

    return `${hours}:${minutes}`;
};

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <View className="mb-5 rounded-2xl border border-gray-200 bg-white p-4">
            <View className="mb-4 border-b border-gray-100 pb-3">
                <Text className="text-lg font-bold text-gray-800">
                    {title}
                </Text>
            </View>

            {children}
        </View>
    );
}

function Field({
    label,
    value,
    onChangeText,
    placeholder,
    maxLength,
    editable = true,
    multiline = false,
    keyboardType = "default",
}: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder?: string;
    maxLength?: number;
    editable?: boolean;
    multiline?: boolean;
    keyboardType?: any;
}) {
    return (
        <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-gray-700">
                {label}
            </Text>

            <TextInput
                value={value ?? ""}
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                editable={editable}
                keyboardType={keyboardType}
                multiline={multiline}
                textAlignVertical={
                    multiline
                        ? "top"
                        : "center"
                }
                onChangeText={(text) => {
                    if (
                        maxLength !== undefined &&
                        text.length >
                            maxLength
                    ) {
                        return;
                    }

                    onChangeText(text);
                }}
                className={`rounded-xl border border-gray-200 bg-white px-4 text-gray-800 ${
                    multiline
                        ? "min-h-[120px] py-3"
                        : "h-12"
                } ${
                    !editable
                        ? "bg-gray-100 text-gray-500"
                        : ""
                }`}
            />

            {maxLength !== undefined && (
                <Text className="mt-1 text-right text-xs text-gray-400">
                    {(value?.length || 0)}/
                    {maxLength}
                </Text>
            )}
        </View>
    );
}

function ReadOnlySignature({
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

                <Text className="ml-2 flex-1 text-sm text-gray-400">
                    Signature will be completed electronically
                </Text>
            </View>
        </View>
    );
}

function RadioOption({
    label,
    selected,
    onPress,
}: {
    label: string;
    selected: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            className="mr-4 mb-2 flex-row items-center"
        >
            <View
                className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
                    selected
                        ? "border-blue-600"
                        : "border-gray-300"
                }`}
            >
                {selected && (
                    <View className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                )}
            </View>

            <Text className="ml-2 text-sm text-gray-700">
                {label}
            </Text>
        </Pressable>
    );
}

export default function SCSAAFAForm() {
    const router = useRouter();

    const {
        id,
        mode,
    } =
        useLocalSearchParams<{
            id?: string;
            mode?: string;
        }>();

    const { user } = useAuth();

    const isAdmin = mode === "admin";

    const [
        checkingTransactionAuth,
        setCheckingTransactionAuth,
    ] = useState(isAdmin);

    const [
        transactionUserId,
        setTransactionUserId,
    ] = useState<string | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [isSaved, setIsSaved] =
        useState(false);

    const [formData, setFormData] =
        useState<FormData>(INITIAL_FORM);

    const [
        datePicker,
        setDatePicker,
    ] = useState<
        "signedDate" | "spouseDate" | null
    >(null);

    const [
        timePicker,
        setTimePicker,
    ] = useState<
        "spouseTime" | null
    >(null);

    const [
        datePickerValue,
        setDatePickerValue,
    ] = useState(new Date());

    const [
        timePickerValue,
        setTimePickerValue,
    ] = useState(new Date());

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
     * Admin email
     *      ↓
     * check-super-admin
     *      ↓
     * transaction user ID
     */
    useEffect(() => {
        if (!isAdmin) {
            setCheckingTransactionAuth(false);
            return;
        }

        const resolveTransactionUser =
            async () => {
                try {
                    if (!user?.email) {
                        throw new Error(
                            "Admin session not found."
                        );
                    }

                    const response =
                        await fetch(
                            `${API_BASE}/transactions/check-super-admin/${encodeURIComponent(
                                user.email
                            )}`
                        );

                    const data =
                        await response.json();

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
                        getTransactionUserId(
                            transactionUser
                        );

                    if (!resolvedId) {
                        throw new Error(
                            "Transaction user ID was not returned by the server."
                        );
                    }

                    setTransactionUserId(
                        resolvedId
                    );
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
                                onPress: () =>
                                    router.back(),
                            },
                        ]
                    );
                } finally {
                    setCheckingTransactionAuth(
                        false
                    );
                }
            };

        resolveTransactionUser();
    }, [
        isAdmin,
        user?.email,
    ]);

    /**
     * LOAD DATA
     */
    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        if (
            isAdmin &&
            !transactionUserId
        ) {
            return;
        }

        const loadData = async () => {
            try {
                setLoading(true);

                const controller =
                    new AbortController();

                const timeout =
                    setTimeout(
                        () =>
                            controller.abort(),
                        15000
                    );

                const [
                    partyRes,
                    transactionRes,
                    adminRes,
                    scsaafaRes,
                ] =
                    await Promise.all([
                        fetch(
                            `${API_BASE}/transactions/parties/transactionParty/settings/${id}`,
                            {
                                signal:
                                    controller.signal,
                            }
                        ),

                        fetch(
                            `${API_BASE}/transactions/transaction/settings/${id}`,
                            {
                                signal:
                                    controller.signal,
                            }
                        ),

                        fetch(
                            `${API_BASE}/admin/settings/by-party/${id}`,
                            {
                                signal:
                                    controller.signal,
                            }
                        ),

                        fetch(
                            `${API_BASE}/scsaafa/user/${id}`,
                            {
                                signal:
                                    controller.signal,
                            }
                        ),
                    ]);

                clearTimeout(timeout);

                const parseJSON =
                    async (
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
                    scsaafaJson,
                ] =
                    await Promise.all([
                        parseJSON(partyRes),
                        parseJSON(
                            transactionRes
                        ),
                        parseJSON(adminRes),
                        parseJSON(
                            scsaafaRes
                        ),
                    ]);

                if (
                    !partyRes.ok ||
                    !transactionRes.ok ||
                    !adminRes.ok ||
                    !scsaafaRes.ok
                ) {
                    throw new Error(
                        "Failed to load SCSAAFA data."
                    );
                }

                const partysettings =
                    partyJson?.data ||
                    {};

                const transactionsettings =
                    transactionJson?.data ||
                    {};

                const settings =
                    adminJson?.data ||
                    {};

                const cleanData =
                    scsaafaJson?.data ||
                    {};

                /**
                 * Identity data
                 */
                const passport =
                    partysettings
                        ?.identityData
                        ?.passport
                        ?.fullName
                        ? partysettings
                              .identityData
                              .passport
                        : null;

                const license =
                    partysettings
                        ?.identityData
                        ?.license
                        ?.fullName
                        ? partysettings
                              .identityData
                              .license
                        : null;

                const sellerFullName =
                    passport?.fullName ||
                    license?.fullName ||
                    partysettings?.name ||
                    "";

                const brokerageAddress =
                    `${settings?.brokerageStreetNum || ""} ${
                        settings?.brokerageStreet ||
                        ""
                    } ${
                        settings?.brokerageCity ||
                        ""
                    } ${
                        settings?.brokerageState ||
                        ""
                    } ${
                        settings?.brokeragePostalCode ||
                        ""
                    }`.trim();

                setFormData(
                    (prev) => ({
                        ...INITIAL_FORM,

                        ...cleanData,

                        brokerageName1:
                            pick(
                                cleanData?.brokerageName1,
                                prev.brokerageName1,
                                settings?.brokerageName,
                                ""
                            ),

                        brokerageName:
                            pick(
                                cleanData?.brokerageName,
                                prev.brokerageName,
                                settings?.brokerageName,
                                ""
                            ),

                        brokerageName2:
                            pick(
                                cleanData?.brokerageName2,
                                prev.brokerageName2,
                                settings?.repName,
                                ""
                            ),

                        repPrintName:
                            pick(
                                cleanData?.repPrintName,
                                prev.repPrintName,
                                settings?.repName,
                                ""
                            ),

                        repSignatureEmail:
                            pick(
                                cleanData?.repSignatureEmail,
                                prev.repSignatureEmail,
                                settings?.repEmail,
                                ""
                            ),

                        brokerageAddress:
                            pick(
                                cleanData?.brokerageAddress,
                                prev.brokerageAddress,
                                brokerageAddress,
                                ""
                            ),

                        brokeragePhone:
                            pick(
                                cleanData?.brokeragePhone,
                                prev.brokeragePhone,
                                settings?.brokeragePhone,
                                ""
                            ),

                        brokerageEmail:
                            pick(
                                cleanData?.brokerageEmail,
                                prev.brokerageEmail,
                                settings?.brokerageEmail,
                                ""
                            ),

                        repName:
                            pick(
                                cleanData?.repName,
                                prev.repName,
                                settings?.repName,
                                ""
                            ),

                        repPhone:
                            pick(
                                cleanData?.repPhone,
                                prev.repPhone,
                                settings?.repPhone,
                                ""
                            ),

                        repEmail:
                            pick(
                                cleanData?.repEmail,
                                prev.repEmail,
                                settings?.repEmail,
                                ""
                            ),

                        sellerName1:
                            pick(
                                cleanData?.sellerName1,
                                prev.sellerName1,
                                sellerFullName,
                                ""
                            ),

                        sellerPrint1:
                            pick(
                                cleanData?.sellerPrint1,
                                prev.sellerPrint1,
                                sellerFullName,
                                ""
                            ),

                        seller1Name:
                            pick(
                                cleanData?.seller1Name,
                                prev.seller1Name,
                                sellerFullName,
                                ""
                            ),

                        sellerSignatureEmail1:
                            pick(
                                cleanData?.sellerSignatureEmail1,
                                prev.sellerSignatureEmail1,
                                partysettings?.email,
                                ""
                            ),

                        seller1Phone:
                            pick(
                                cleanData?.seller1Phone,
                                prev.seller1Phone,
                                partysettings?.phone,
                                ""
                            ),

                        seller1Email:
                            pick(
                                cleanData?.seller1Email,
                                prev.seller1Email,
                                partysettings?.email,
                                ""
                            ),

                        sellerSignatureEmail2:
                            pick(
                                cleanData?.sellerSignatureEmail2,
                                prev.sellerSignatureEmail2,
                                ""
                            ),

                        witnessEmail1:
                            pick(
                                cleanData?.witnessEmail1,
                                prev.witnessEmail1,
                                ""
                            ),

                        witnessEmail2:
                            pick(
                                cleanData?.witnessEmail2,
                                prev.witnessEmail2,
                                ""
                            ),

                        spouseSignatureEmail:
                            pick(
                                cleanData?.spouseSignatureEmail,
                                prev.spouseSignatureEmail,
                                ""
                            ),

                        spouseWitnessEmail:
                            pick(
                                cleanData?.spouseWitnessEmail,
                                prev.spouseWitnessEmail,
                                ""
                            ),

                        agreementNumber:
                            pick(
                                cleanData?.agreementNumber,
                                prev.agreementNumber,
                                transactionsettings?.agreementnumber,
                                ""
                            ),
                    })
                );

                if (scsaafaJson?.data) {
                    setIsSaved(true);
                }
            } catch (error: any) {
                console.error(
                    "SCSAAFA LOAD ERROR:",
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
                            "Failed to load SCSAAFA data."
                    );
                }
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [
        id,
        isAdmin,
        transactionUserId,
    ]);

    /**
     * DATE PICKER
     */
    const openDatePicker = (
        field:
            | "signedDate"
            | "spouseDate"
    ) => {
        setDatePickerValue(
            parseDate(
                formData[field]
            )
        );

        setDatePicker(field);
    };

    /**
     * TIME PICKER
     */
    const openTimePicker = (
        field: "spouseTime"
    ) => {
        const existing =
            formData[field];

        const date = new Date();

        if (existing) {
            const [
                hours,
                minutes,
            ] =
                existing.split(":");

            date.setHours(
                Number(hours) || 0
            );

            date.setMinutes(
                Number(minutes) || 0
            );
        }

        setTimePickerValue(date);

        setTimePicker(field);
    };

    const handleDateChange = (
        event: any,
        selectedDate?: Date
    ) => {
        if (
            Platform.OS ===
            "android"
        ) {
            setDatePicker(null);
        }

        if (
            !selectedDate ||
            !datePicker
        ) {
            return;
        }

        updateField(
            datePicker,
            formatDate(
                selectedDate
            )
        );

        if (
            Platform.OS === "ios"
        ) {
            setDatePickerValue(
                selectedDate
            );
        }
    };

    const handleTimeChange = (
        event: any,
        selectedTime?: Date
    ) => {
        if (
            Platform.OS ===
            "android"
        ) {
            setTimePicker(null);
        }

        if (
            !selectedTime ||
            !timePicker
        ) {
            return;
        }

        updateField(
            timePicker,
            formatTime(
                selectedTime
            )
        );

        if (
            Platform.OS === "ios"
        ) {
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

            const timeout =
                setTimeout(
                    () =>
                        controller.abort(),
                    20000
                );

            const response =
                await fetch(
                    `${API_BASE}/scsaafa/generate-pdf`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify(
                            payload
                        ),

                        signal:
                            controller.signal,
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
             * ADMIN → PDF
             *
             * Mobile doesn't use
             * browser Blob/download APIs.
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
                    "SCSAAFA updated successfully ✅"
                );

                return;
            }

            /**
             * NORMAL USER → JSON
             */
            try {
                await response.json();
            } catch {
                throw new Error(
                    "Invalid server response."
                );
            }

            setIsSaved(true);

            Alert.alert(
                "Success",
                "Seller Customer Acknowledgment and Fee Agreement saved ✅"
            );
        } catch (error: any) {
            console.error(
                "SCSAAFA SUBMIT ERROR:",
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
                        : "Loading SCSAAFA form..."}
                </Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-gray-50"
            behavior={
                Platform.OS ===
                "ios"
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
                showsVerticalScrollIndicator={
                    false
                }
            >
                {/* HEADER */}
                <View className="mb-5 flex-row items-start">
                  
                    <View className="flex-1">
                        <Text className="text-2xl font-bold text-gray-800">
                            Seller Customer Acknowledgment and Fee Agreement
                        </Text>

                        <Text className="mt-1 text-sm text-gray-500">
                            Complete the seller acknowledgment and fee agreement.
                        </Text>
                    </View>
                </View>

                {/* ADMIN */}
                {/* {isAdmin && (
                    <View className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                        <View className="flex-row items-center">
                            <Ionicons
                                name="shield-checkmark-outline"
                                size={20}
                                color="#2563eb"
                            />

                            <Text className="ml-2 font-semibold text-blue-700">
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
                        onChangeText={(value) =>
                            updateField(
                                "agreementNumber",
                                value
                            )
                        }
                    />
                </Section>

                {/* BROKERAGE */}
                <Section title="THE BUYER'S BROKERAGE (WE)">
                    <Field
                        label="Brokerage Name"
                        value={
                            formData.brokerageName1
                        }
                        placeholder="Name"
                        maxLength={80}
                        onChangeText={(value) =>
                            updateField(
                                "brokerageName1",
                                value
                            )
                        }
                    />

                    <Field
                        label="Additional Brokerage Name"
                        value={
                            formData.brokerageName2
                        }
                        placeholder="Name"
                        maxLength={80}
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
                        label="Additional Seller Name"
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

                {/* PROPERTY */}
                <Section title="1. THE PROPERTY">
                    <Text className="mb-4 text-sm leading-5 text-gray-600">
                        The land and buildings at (municipal address):
                    </Text>

                    <Field
                        label="Unit Number"
                        value={
                            formData.propertyUnitNumber
                        }
                        placeholder="Unit Number"
                        maxLength={10}
                        onChangeText={(value) =>
                            updateField(
                                "propertyUnitNumber",
                                value
                            )
                        }
                    />

                    <Field
                        label="Street Number"
                        value={
                            formData.streetNumber
                        }
                        placeholder="Street Number"
                        maxLength={10}
                        onChangeText={(value) =>
                            updateField(
                                "streetNumber",
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

                    {/* NON-CONDO */}
                    <View className="mt-3">
                        <Text className="mb-3 text-base font-bold text-gray-800">
                            Legal Description — Non-Condominium
                        </Text>

                        <Field
                            label="Plan"
                            value={
                                formData.plan
                            }
                            placeholder="Plan"
                            maxLength={40}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "plan",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Block"
                            value={
                                formData.block
                            }
                            placeholder="Block"
                            maxLength={40}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "block",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Lot"
                            value={
                                formData.lot
                            }
                            placeholder="Lot"
                            maxLength={20}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "lot",
                                    value
                                )
                            }
                        />
                    </View>

                    <View className="my-3 items-center">
                        <View className="rounded-full bg-gray-100 px-4 py-1">
                            <Text className="text-xs font-bold text-gray-500">
                                OR
                            </Text>
                        </View>
                    </View>

                    {/* CONDO */}
                    <View>
                        <Text className="mb-3 text-base font-bold text-gray-800">
                            Condominium
                        </Text>

                        <Field
                            label="Plan"
                            value={
                                formData.condoPlan
                            }
                            placeholder="Plan"
                            maxLength={40}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "condoPlan",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Unit Number"
                            value={
                                formData.unitNumber
                            }
                            placeholder="Unit Number"
                            maxLength={40}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "unitNumber",
                                    value
                                )
                            }
                        />
                    </View>

                    <View className="my-3 items-center">
                        <View className="rounded-full bg-gray-100 px-4 py-1">
                            <Text className="text-xs font-bold text-gray-500">
                                OR
                            </Text>
                        </View>
                    </View>

                    {/* ATS */}
                    <View>
                        <Text className="mb-4 text-base font-bold text-gray-800">
                            Alberta Township Survey (ATS)
                        </Text>

                        <Field
                            label="W. of Meridian"
                            value={
                                formData.meridian
                            }
                            placeholder="Meridian"
                            maxLength={40}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "meridian",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Range"
                            value={
                                formData.range
                            }
                            placeholder="Range"
                            maxLength={40}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "range",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Township"
                            value={
                                formData.township
                            }
                            placeholder="Township"
                            maxLength={30}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "township",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Section"
                            value={
                                formData.section
                            }
                            placeholder="Section"
                            maxLength={40}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "section",
                                    value
                                )
                            }
                        />
                    </View>
                </Section>

                {/* FEE */}
                <Section title="5. Fee">
                    <Field
                        label="Fee Amount"
                        value={
                            formData.feeAmount
                        }
                        placeholder="Fee Amount"
                        onChangeText={(value) =>
                            updateField(
                                "feeAmount",
                                value
                            )
                        }
                    />

                    <Field
                        label="Days (completion)"
                        value={
                            formData.feeDays1
                        }
                        placeholder="Days"
                        onChangeText={(value) =>
                            updateField(
                                "feeDays1",
                                value
                            )
                        }
                    />

                    <Field
                        label="Days (not completed)"
                        value={
                            formData.feeDays2
                        }
                        placeholder="Days"
                        onChangeText={(value) =>
                            updateField(
                                "feeDays2",
                                value
                            )
                        }
                    />
                </Section>

                {/* DOWER */}
                <Section title="9. Dower Consent">
                    <Text className="mb-3 text-sm font-semibold text-gray-700">
                        Are you legally married?
                    </Text>

                    <View className="mb-5 flex-row flex-wrap">
                        <RadioOption
                            label="Yes"
                            selected={
                                formData.married ===
                                "yes"
                            }
                            onPress={() =>
                                updateField(
                                    "married",
                                    "yes"
                                )
                            }
                        />

                        <RadioOption
                            label="No"
                            selected={
                                formData.married ===
                                "no"
                            }
                            onPress={() =>
                                updateField(
                                    "married",
                                    "no"
                                )
                            }
                        />
                    </View>

                    <Text className="mb-3 text-sm font-semibold text-gray-700">
                        Have you or your spouse resided on the property?
                    </Text>

                    <View className="flex-row flex-wrap">
                        <RadioOption
                            label="Yes"
                            selected={
                                formData.resided ===
                                "yes"
                            }
                            onPress={() =>
                                updateField(
                                    "resided",
                                    "yes"
                                )
                            }
                        />

                        <RadioOption
                            label="No"
                            selected={
                                formData.resided ===
                                "no"
                            }
                            onPress={() =>
                                updateField(
                                    "resided",
                                    "no"
                                )
                            }
                        />
                    </View>
                </Section>

                {/* CONTACT INFORMATION */}
                <Section title="12. Contact Information">
                    {/* SELLER 1 */}
                    <View className="mb-6 rounded-2xl bg-gray-50 p-4">
                        <Text className="mb-4 text-base font-bold text-gray-800">
                            SELLER
                        </Text>

                        <Field
                            label="Seller Name"
                            value={
                                formData.seller1Name
                            }
                            placeholder="Name"
                            maxLength={40}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "seller1Name",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Street Number"
                            value={
                                formData.seller1Streetnum
                            }
                            placeholder="Street Number"
                            maxLength={10}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "seller1Streetnum",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Street"
                            value={
                                formData.seller1Street
                            }
                            placeholder="Street"
                            maxLength={60}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "seller1Street",
                                    value
                                )
                            }
                        />

                        <Field
                            label="City"
                            value={
                                formData.seller1City
                            }
                            placeholder="City"
                            maxLength={40}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "seller1City",
                                    value
                                )
                            }
                        />

                        <Field
                            label="State"
                            value={
                                formData.seller1State
                            }
                            placeholder="State"
                            maxLength={2}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "seller1State",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Zip Code"
                            value={
                                formData.seller1Zipcode
                            }
                            placeholder="Zip Code"
                            maxLength={80}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "seller1Zipcode",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Phone"
                            value={
                                formData.seller1Phone
                            }
                            placeholder="Phone"
                            maxLength={20}
                            keyboardType="phone-pad"
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "seller1Phone",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Fax"
                            value="---------------"
                            editable={false}
                            onChangeText={() => {}}
                        />

                        <Field
                            label="Email"
                            value={
                                formData.seller1Email
                            }
                            placeholder="Email"
                            maxLength={60}
                            keyboardType="email-address"
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "seller1Email",
                                    value
                                )
                            }
                        />
                    </View>

                    {/* SELLER 2 */}
                    <View className="rounded-2xl bg-gray-50 p-4">
                        <Text className="mb-4 text-base font-bold text-gray-800">
                            SELLER 2
                        </Text>

                        <Field
                            label="Seller Name"
                            value={
                                formData.seller2Name
                            }
                            placeholder="Name"
                            maxLength={40}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "seller2Name",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Street Number"
                            value={
                                formData.seller2Streetnum
                            }
                            placeholder="Street Number"
                            maxLength={10}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "seller2Streetnum",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Street"
                            value={
                                formData.seller2Street
                            }
                            placeholder="Street"
                            maxLength={10}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "seller2Street",
                                    value
                                )
                            }
                        />

                        <Field
                            label="City"
                            value={
                                formData.seller2City
                            }
                            placeholder="City"
                            maxLength={40}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "seller2City",
                                    value
                                )
                            }
                        />

                        <Field
                            label="State"
                            value={
                                formData.seller2State
                            }
                            placeholder="State"
                            maxLength={2}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "seller2State",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Zip Code"
                            value={
                                formData.seller2Zipcode
                            }
                            placeholder="Zip Code"
                            maxLength={10}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "seller2Zipcode",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Phone"
                            value={
                                formData.seller2Phone
                            }
                            placeholder="Phone"
                            maxLength={20}
                            keyboardType="phone-pad"
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "seller2Phone",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Fax"
                            value="---------------"
                            editable={false}
                            onChangeText={() => {}}
                        />

                        <Field
                            label="Email"
                            value={
                                formData.seller2Email
                            }
                            placeholder="Email"
                            maxLength={60}
                            keyboardType="email-address"
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "seller2Email",
                                    value
                                )
                            }
                        />
                    </View>

                    {/* BROKERAGE */}
                    <View className="mt-6 rounded-2xl bg-gray-50 p-4">
                        <Text className="mb-4 text-base font-bold text-gray-800">
                            BROKERAGE
                        </Text>

                        <Field
                            label="Brokerage Name"
                            value={
                                formData.brokerageName
                            }
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "brokerageName",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Address"
                            value={
                                formData.brokerageAddress
                            }
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "brokerageAddress",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Phone"
                            value={
                                formData.brokeragePhone
                            }
                            keyboardType="phone-pad"
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "brokeragePhone",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Fax"
                            value="---------------"
                            editable={false}
                            onChangeText={() => {}}
                        />

                        <Field
                            label="Email"
                            value={
                                formData.brokerageEmail
                            }
                            keyboardType="email-address"
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "brokerageEmail",
                                    value
                                )
                            }
                        />
                    </View>

                    {/* REPRESENTATIVE */}
                    <View className="mt-5 rounded-2xl bg-gray-50 p-4">
                        <Text className="mb-4 text-base font-bold text-gray-800">
                            BROKERAGE REPRESENTATIVE
                        </Text>

                        <Field
                            label="Representative Name"
                            value={
                                formData.repName
                            }
                            editable={false}
                            onChangeText={() => {}}
                        />

                        <Field
                            label="Address"
                            value="c/o the Brokerage"
                            editable={false}
                            onChangeText={() => {}}
                        />

                        <Field
                            label="Phone"
                            value={
                                formData.repPhone
                            }
                            editable={false}
                            onChangeText={() => {}}
                        />

                        <Field
                            label="Fax"
                            value="---------------"
                            editable={false}
                            onChangeText={() => {}}
                        />

                        <Field
                            label="Email"
                            value={
                                formData.repEmail
                            }
                            editable={false}
                            onChangeText={() => {}}
                        />
                    </View>
                </Section>

                {/* SIGNATURES */}
                <Section title="Signatures">
                    {/* SELLER 1 */}
                    <View className="mb-6 rounded-2xl bg-gray-50 p-4">
                        <Text className="mb-4 text-base font-bold text-gray-800">
                            Seller 1
                        </Text>

                        <ReadOnlySignature
                            label="Signature of Seller"
                        />

                        <Field
                            label="Print Name of Seller"
                            value={
                                formData.sellerPrint1
                            }
                            placeholder="Print Name of Seller"
                            maxLength={80}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "sellerPrint1",
                                    value
                                )
                            }
                        />

                        {formData.sellerPrint1?.trim() ? (
                            <Field
                                label="Seller Email"
                                value={
                                    formData.sellerSignatureEmail1
                                }
                                placeholder="Seller Email"
                                keyboardType="email-address"
                                onChangeText={(
                                    value
                                ) =>
                                    updateField(
                                        "sellerSignatureEmail1",
                                        value
                                    )
                                }
                            />
                        ) : null}

                        <ReadOnlySignature
                            label="Signature of Witness"
                        />

                        <Field
                            label="Print Name of Witness"
                            value={
                                formData.witnessPrint1
                            }
                            placeholder="Print Name of Witness"
                            maxLength={80}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "witnessPrint1",
                                    value
                                )
                            }
                        />

                        {formData.witnessPrint1?.trim() ? (
                            <Field
                                label="Witness Email"
                                value={
                                    formData.witnessEmail1
                                }
                                placeholder="Witness Email"
                                keyboardType="email-address"
                                onChangeText={(
                                    value
                                ) =>
                                    updateField(
                                        "witnessEmail1",
                                        value
                                    )
                                }
                            />
                        ) : null}
                    </View>

                    {/* SELLER 2 */}
                    <View className="rounded-2xl bg-gray-50 p-4">
                        <Text className="mb-4 text-base font-bold text-gray-800">
                            Seller 2
                        </Text>

                        <ReadOnlySignature
                            label="Signature of Seller"
                        />

                        <Field
                            label="Print Name of Seller"
                            value={
                                formData.sellerPrint2 ||
                                formData.sellerName2
                            }
                            placeholder="Print Name of Seller"
                            maxLength={80}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "sellerPrint2",
                                    value
                                )
                            }
                        />

                        {(formData.sellerName2 ||
                            formData.sellerPrint2) ? (
                            <Field
                                label="Seller Email"
                                value={
                                    formData.sellerSignatureEmail2
                                }
                                placeholder="Seller Email"
                                keyboardType="email-address"
                                onChangeText={(
                                    value
                                ) =>
                                    updateField(
                                        "sellerSignatureEmail2",
                                        value
                                    )
                                }
                            />
                        ) : null}

                        <ReadOnlySignature
                            label="Signature of Witness"
                        />

                        <Field
                            label="Print Name of Witness"
                            value={
                                formData.witnessPrint2
                            }
                            placeholder="Print Name of Witness"
                            maxLength={80}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "witnessPrint2",
                                    value
                                )
                            }
                        />

                        {formData.witnessPrint2?.trim() ? (
                            <Field
                                label="Witness Email"
                                value={
                                    formData.witnessEmail2
                                }
                                placeholder="Witness Email"
                                keyboardType="email-address"
                                onChangeText={(
                                    value
                                ) =>
                                    updateField(
                                        "witnessEmail2",
                                        value
                                    )
                                }
                            />
                        ) : null}
                    </View>

                    {/* BROKER REPRESENTATIVE */}
                    <View className="mt-6">
                        <ReadOnlySignature
                            label="Signature of Brokerage Representative"
                        />

                        <Field
                            label="Print Name of Brokerage Representative"
                            value={
                                formData.repPrintName
                            }
                            editable={false}
                            onChangeText={() => {}}
                        />

                        {formData.repPrintName ? (
                            <Field
                                label="Brokerage Representative Email"
                                value={
                                    formData.repSignatureEmail
                                }
                                placeholder="Brokerage Representative Email"
                                keyboardType="email-address"
                                onChangeText={(
                                    value
                                ) =>
                                    updateField(
                                        "repSignatureEmail",
                                        value
                                    )
                                }
                            />
                        ) : null}
                    </View>
                </Section>

                {/* SPOUSE */}
                <Section title="Non-Owner Spouse Signature">
                    <Text className="mb-4 text-sm leading-5 text-gray-600">
                        Complete this section when dower rights apply.
                    </Text>

                    <Field
                        label="Location"
                        value={
                            formData.spouseLocation
                        }
                        editable={false}
                        onChangeText={() => {}}
                    />

                    <View className="mb-4">
                        <Text className="mb-2 text-sm font-semibold text-gray-700">
                            Time
                        </Text>

                        <Pressable
                            onPress={() =>
                                openTimePicker(
                                    "spouseTime"
                                )
                            }
                            className="h-12 flex-row items-center rounded-xl border border-gray-200 bg-white px-4"
                        >
                            <Ionicons
                                name="time-outline"
                                size={19}
                                color="#6b7280"
                            />

                            <Text className="ml-3 text-gray-800">
                                {formData.spouseTime ||
                                    "Select time"}
                            </Text>
                        </Pressable>
                    </View>

                    <View className="mb-5">
                        <Text className="mb-2 text-sm font-semibold text-gray-700">
                            Date
                        </Text>

                        <Pressable
                            onPress={() =>
                                openDatePicker(
                                    "spouseDate"
                                )
                            }
                            className="h-12 flex-row items-center rounded-xl border border-gray-200 bg-white px-4"
                        >
                            <Ionicons
                                name="calendar-outline"
                                size={19}
                                color="#6b7280"
                            />

                            <Text className="ml-3 text-gray-800">
                                {formData.spouseDate ||
                                    "Select date"}
                            </Text>
                        </Pressable>
                    </View>

                    {/* SPOUSE */}
                    <View className="mb-5 rounded-2xl bg-gray-50 p-4">
                        <Text className="mb-4 text-base font-bold text-gray-800">
                            Non-Owner Spouse
                        </Text>

                        <ReadOnlySignature
                            label="Non-Owner Spouse Signature"
                        />

                        <Field
                            label="Spouse Name (Print)"
                            value={
                                formData.spouseName
                            }
                            placeholder="Spouse Name (Print)"
                            maxLength={80}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "spouseName",
                                    value
                                )
                            }
                        />

                        {formData.spouseName?.trim() ? (
                            <Field
                                label="Spouse Email"
                                value={
                                    formData.spouseSignatureEmail
                                }
                                placeholder="Spouse Email"
                                keyboardType="email-address"
                                onChangeText={(
                                    value
                                ) =>
                                    updateField(
                                        "spouseSignatureEmail",
                                        value
                                    )
                                }
                            />
                        ) : null}
                    </View>

                    {/* SPOUSE WITNESS */}
                    <View className="rounded-2xl bg-gray-50 p-4">
                        <Text className="mb-4 text-base font-bold text-gray-800">
                            Spouse Witness
                        </Text>

                        <ReadOnlySignature
                            label="Witness Signature"
                        />

                        <Field
                            label="Witness Name (Print)"
                            value={
                                formData.spouseWitnessName
                            }
                            placeholder="Witness Name (Print)"
                            maxLength={80}
                            onChangeText={(
                                value
                            ) =>
                                updateField(
                                    "spouseWitnessName",
                                    value
                                )
                            }
                        />

                        {formData.spouseWitnessName?.trim() ? (
                            <Field
                                label="Witness Email"
                                value={
                                    formData.spouseWitnessEmail
                                }
                                placeholder="Witness Email"
                                keyboardType="email-address"
                                onChangeText={(
                                    value
                                ) =>
                                    updateField(
                                        "spouseWitnessEmail",
                                        value
                                    )
                                }
                            />
                        ) : null}
                    </View>
                </Section>

                {/* SIGNED DATE */}
                <Section title="Signing Information">
                    <View>
                        <Text className="mb-2 text-sm font-semibold text-gray-700">
                            Signed Date
                        </Text>

                        <Pressable
                            onPress={() =>
                                openDatePicker(
                                    "signedDate"
                                )
                            }
                            className="h-12 flex-row items-center rounded-xl border border-gray-200 bg-white px-4"
                        >
                            <Ionicons
                                name="calendar-outline"
                                size={19}
                                color="#6b7280"
                            />

                            <Text className="ml-3 text-gray-800">
                                {formData.signedDate ||
                                    "Select date"}
                            </Text>
                        </Pressable>
                    </View>
                </Section>

                {/* SAVED STATUS */}
                {isSaved && (
                    <View className="mb-5 flex-row items-center rounded-xl border border-green-200 bg-green-50 p-4">
                        <Ionicons
                            name="checkmark-circle"
                            size={21}
                            color="#16a34a"
                        />

                        <Text className="ml-2 flex-1 text-sm font-semibold text-green-700">
                            SCSAAFA has been saved.
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
                                handleSubmit(
                                    false
                                )
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
                        Platform.OS ===
                        "ios"
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
                        Platform.OS ===
                        "ios"
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