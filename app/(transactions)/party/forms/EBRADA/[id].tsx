import React, { useEffect, useState } from "react";

import {
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

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
    propertyType: string;
    marketAreas: string;
    designatedAgentName: string;
    startDate: string;
    startYear: string;
    startTime: string;
    endDate: string;
    endYear: string;
    endTime: string;
    agentServices: string;
    daysAfterAgreement: string;
    ourFee: string;
    retainerAmount: string;
    retainerMonth: string;
    retainerDay: string;
    retainerYear: string;
    refundDays: string;
    otherPaymentTerms: string;
    contractDaysAfterAgreement: string;
    paymentAfterPurchaseDays: string;
    refundDifferenceDays: string;
    differencePaymentDays: string;
    reasonableExpenses: string;
    additionalTerms: string;
    attachedDocuments: string;

    buyer1Name: string;
    buyer1Address: string;
    buyer1Phone: string;
    buyer1Fax: string;
    buyer1Email: string;

    buyer2Name: string;
    buyer2Address: string;
    buyer2Phone: string;
    buyer2Fax: string;
    buyer2Email: string;

    brokerageName: string;
    brokerageAddress: string;
    brokeragePhone: string;
    brokerageFax: string;
    brokerageEmail: string;

    repName: string;
    repPhone: string;
    repFax: string;
    repEmail: string;

    signedDateM: string;
    signedDateD: string;
    signedYear: string;

    buyersig1: string;
    buyersig2: string;

    witness1sig: string;
    witness2sig: string;

    agentsig: string;

    buyerSignatureEmail1: string;
    buyerSignatureEmail2: string;

    witness1Email: string;
    witness2Email: string;

    agentEmail: string;
};

const initialFormData: FormData = {
    agreementNumber: "",
    brokerageName1: "",
    brokerageName2: "",
    buyerName1: "",
    buyerName2: "",
    propertyType: "",
    marketAreas: "",
    designatedAgentName: "",
    startDate: "",
    startYear: "",
    startTime: "",
    endDate: "",
    endYear: "",
    endTime: "",
    agentServices: "",
    daysAfterAgreement: "",
    ourFee: "",
    retainerAmount: "",
    retainerMonth: "",
    retainerDay: "",
    retainerYear: "",
    refundDays: "",
    otherPaymentTerms: "",
    contractDaysAfterAgreement: "",
    paymentAfterPurchaseDays: "",
    refundDifferenceDays: "",
    differencePaymentDays: "",
    reasonableExpenses: "",
    additionalTerms: "",
    attachedDocuments: "",

    buyer1Name: "",
    buyer1Address: "",
    buyer1Phone: "",
    buyer1Fax: "",
    buyer1Email: "",

    buyer2Name: "",
    buyer2Address: "",
    buyer2Phone: "",
    buyer2Fax: "",
    buyer2Email: "",

    brokerageName: "",
    brokerageAddress: "",
    brokeragePhone: "",
    brokerageFax: "",
    brokerageEmail: "",

    repName: "",
    repPhone: "",
    repFax: "",
    repEmail: "",

    signedDateM: "",
    signedDateD: "",
    signedYear: "",

    buyersig1: "",
    buyersig2: "",

    witness1sig: "",
    witness2sig: "",

    agentsig: "",

    buyerSignatureEmail1: "",
    buyerSignatureEmail2: "",

    witness1Email: "",
    witness2Email: "",

    agentEmail: "",
};

/* =========================================================
   SMALL UI COMPONENTS
========================================================= */

function SectionTitle({
    number,
    title,
}: {
    number?: string;
    title: string;
}) {
    return (
        <View className="mb-4 border-b border-gray-200 pb-3">
            <Text className="text-lg font-bold text-gray-800">
                {number ? `${number}. ` : ""}
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
                    disabled ? "bg-gray-100 text-gray-400" : "",
                ].join(" ")}
            />

            {maxLength ? (
                <Text className="mt-1 text-right text-xs text-gray-400">
                    {value?.length || 0}/{maxLength}
                </Text>
            ) : null}
        </View>
    );
}

function SmallField({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
    disabled = false,
}: {
    label?: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder?: string;
    keyboardType?: any;
    disabled?: boolean;
}) {
    return (
        <View className="flex-1">
            {label ? (
                <Text className="mb-1.5 text-xs font-medium text-gray-600">
                    {label}
                </Text>
            ) : null}

            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
                keyboardType={keyboardType}
                editable={!disabled}
                className={[
                    "h-12 rounded-xl border border-gray-200 bg-white px-3 text-gray-800",
                    disabled ? "bg-gray-100 text-gray-400" : "",
                ].join(" ")}
            />
        </View>
    );
}

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

function StepIndicator({ step }: { step: number }) {
    return (
        <View className="mb-6 flex-row items-center justify-center">
            {[1, 2, 3, 4].map((item, index) => (
                <React.Fragment key={item}>
                    <View
                        className={[
                            "h-9 w-9 items-center justify-center rounded-full",
                            step === item
                                ? "bg-blue-600"
                                : step > item
                                    ? "bg-green-500"
                                    : "bg-gray-200",
                        ].join(" ")}
                    >
                        {step > item ? (
                            <Ionicons
                                name="checkmark"
                                size={18}
                                color="#ffffff"
                            />
                        ) : (
                            <Text
                                className={[
                                    "text-sm font-bold",
                                    step === item
                                        ? "text-white"
                                        : "text-gray-600",
                                ].join(" ")}
                            >
                                {item}
                            </Text>
                        )}
                    </View>

                    {index !== 3 ? (
                        <View
                            className={[
                                "mx-1 h-[2px] w-8",
                                step > item
                                    ? "bg-green-500"
                                    : "bg-gray-300",
                            ].join(" ")}
                        />
                    ) : null}
                </React.Fragment>
            ))}
        </View>
    );
}

/* =========================================================
   SCREEN
========================================================= */

export default function EBRADAForm() {
    const router = useRouter();

    const params = useLocalSearchParams<{
        id?: string;
        mode?: string;
    }>();

    const { user, loading: authLoading } = useAuth();

    const id = Array.isArray(params.id)
        ? params.id[0]
        : params.id;

    const isAdmin =
        params.mode === "admin";

    const [step, setStep] = useState(1);

    const [checkingTransactionAuth, setCheckingTransactionAuth] =
        useState(isAdmin);

    const [transactionUserId, setTransactionUserId] =
        useState<string | null>(null);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [formData, setFormData] =
        useState<FormData>(initialFormData);

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

       Admin login email
          ↓
       check-super-admin
          ↓
       transaction user
          ↓
       transactionUserId
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
                                    "/(transactions)/login" as any
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
                    ebradaRes,
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
                        `${API_BASE}/ebradapdf/buyeragreement/user/${id}`,
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
                    ebradaJson,
                ] = await Promise.all([
                    parseJSON(partyRes),
                    parseJSON(transactionRes),
                    parseJSON(adminRes),
                    parseJSON(ebradaRes),
                ]);

                if (
                    !partyRes.ok ||
                    !transactionRes.ok ||
                    !adminRes.ok ||
                    !ebradaRes.ok
                ) {
                    throw new Error(
                        "Failed to load saved EBRADA data."
                    );
                }

                const partysettings =
                    partysettingsJson?.data || {};

                const transactionsettings =
                    transactionJson?.data || {};

                const settings =
                    adminJson?.data || {};

                const cleanData =
                    ebradaJson?.data || {};

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

                const brokerageAddress = [
                    settings?.brokerageStreetNum,
                    settings?.brokerageStreet,
                    settings?.brokerageCity,
                    settings?.brokerageState,
                    settings?.brokeragePostalCode,
                ]
                    .filter(Boolean)
                    .join(" ");

                if (cancelled) return;

                setFormData((prev) => ({
                    ...prev,

                    /* =====================================
                       BUYER
                    ===================================== */

                    buyerName1:
                        cleanData?.buyerName1 ||
                        prev.buyerName1 ||
                        buyerFullName,

                    buyer1Name:
                        cleanData?.buyer1Name ||
                        prev.buyer1Name ||
                        buyerFullName,

                    buyer2Name:
                        cleanData?.buyer2Name ||
                        prev.buyer2Name ||
                        "",

                    buyer1Phone:
                        cleanData?.buyer1Phone ||
                        prev.buyer1Phone ||
                        partysettings?.phone ||
                        "",

                    buyer1Email:
                        cleanData?.buyer1Email ||
                        prev.buyer1Email ||
                        partysettings?.email ||
                        "",

                    buyerSignatureEmail1:
                        cleanData?.buyerSignatureEmail1 ||
                        prev.buyerSignatureEmail1 ||
                        partysettings?.email ||
                        "",

                    buyerSignatureEmail2:
                        cleanData?.buyerSignatureEmail2 ||
                        prev.buyerSignatureEmail2 ||
                        "",

                    /* =====================================
                       WITNESSES
                    ===================================== */

                    witness1Email:
                        cleanData?.witness1Email ||
                        prev.witness1Email ||
                        "",

                    witness2Email:
                        cleanData?.witness2Email ||
                        prev.witness2Email ||
                        "",

                    /* =====================================
                       AGENT
                    ===================================== */

                    agentEmail:
                        cleanData?.agentEmail ||
                        prev.agentEmail ||
                        settings?.repEmail ||
                        "",

                    /* =====================================
                       SIGNATURE
                    ===================================== */

                    buyersig1:
                        cleanData?.buyersig1 ||
                        prev.buyersig1 ||
                        buyerFullName,

                    agentsig:
                        cleanData?.agentsig ||
                        prev.agentsig ||
                        settings?.repName ||
                        "",

                    /* =====================================
                       AGREEMENT
                    ===================================== */

                    agreementNumber:
                        cleanData?.agreementNumber ||
                        prev.agreementNumber ||
                        transactionsettings?.agreementnumber ||
                        "",

                    /* =====================================
                       BROKERAGE
                    ===================================== */

                    brokerageName1:
                        cleanData?.brokerageName1 ||
                        prev.brokerageName1 ||
                        settings?.brokerageName ||
                        "",

                    brokerageName:
                        cleanData?.brokerageName ||
                        prev.brokerageName ||
                        settings?.brokerageName ||
                        "",

                    brokerageName2:
                        cleanData?.brokerageName2 ||
                        prev.brokerageName2 ||
                        settings?.repName ||
                        "",

                    brokerageAddress:
                        cleanData?.brokerageAddress ||
                        prev.brokerageAddress ||
                        brokerageAddress,

                    brokeragePhone:
                        cleanData?.brokeragePhone ||
                        prev.brokeragePhone ||
                        settings?.brokeragePhone ||
                        "",

                    brokerageEmail:
                        cleanData?.brokerageEmail ||
                        prev.brokerageEmail ||
                        settings?.brokerageEmail ||
                        "",

                    /* =====================================
                       REPRESENTATIVE
                    ===================================== */

                    repName:
                        cleanData?.repName ||
                        prev.repName ||
                        settings?.repName ||
                        "",

                    repPhone:
                        cleanData?.repPhone ||
                        prev.repPhone ||
                        settings?.repPhone ||
                        "",

                    repEmail:
                        cleanData?.repEmail ||
                        prev.repEmail ||
                        settings?.repEmail ||
                        "",

                    designatedAgentName:
                        cleanData?.designatedAgentName ||
                        prev.designatedAgentName ||
                        settings?.repName ||
                        "",

                    /* =====================================
                       EXISTING DATA LAST
                    ===================================== */

                    ...cleanData,
                }));
            } catch (error: any) {
                console.error(
                    "EBRADA LOAD ERROR:",
                    error
                );

                if (cancelled) return;

                if (error?.name === "AbortError") {
                    Alert.alert(
                        "Timeout",
                        "The request timed out while loading the agreement."
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
                `${API_BASE}/ebradapdf/buyeragreement/generate-pdf`,
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
                    // Ignore invalid error response
                }

                throw new Error(message);
            }

            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";

            /* =============================================
               ADMIN → PDF RESPONSE
            ============================================= */

            if (
                contentType.includes(
                    "application/pdf"
                )
            ) {
                // Consume the PDF response so the
                // request completes correctly on mobile.
                await response.arrayBuffer();

                Alert.alert(
                    "Success",
                    "Buyer Agreement updated successfully."
                );

                return;
            }

            /* =============================================
               NORMAL USER → JSON RESPONSE
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
                    "Exclusive Buyer Representation Agreement saved successfully."
            );
        } catch (error: any) {
            console.error(
                "EBRADA SUBMIT ERROR:",
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
       AUTH LOADING
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
                    Loading agreement...
                </Text>

                <Text className="mt-1 text-center text-sm text-gray-500">
                    Loading saved EBRADA information.
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
                    HEADER
                ========================================= */}

                {/* {isAdmin ? (
                    <View className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
                        <View className="flex-row items-center">
                            <Ionicons
                                name="shield-checkmark"
                                size={19}
                                color="#2563eb"
                            />

                            <Text className="ml-2 flex-1 text-sm font-semibold text-blue-700">
                                Admin Mode
                            </Text>
                        </View>

                        <Text className="mt-1 text-xs text-blue-600">
                            You can edit the agreement but cannot change the workflow.
                        </Text>
                    </View>
                ) : null} */}

                <View className="mb-5">
                    <Text className="text-center text-xl font-bold leading-7 text-gray-800">
                        EXCLUSIVE BUYER
                        {"\n"}
                        REPRESENTATION AGREEMENT
                    </Text>
                </View>

                <StepIndicator step={step} />

                {/* =========================================
                    STEP 1
                ========================================= */}

                {step === 1 ? (
                    <>
                        <Card>
                            <View className="mb-4 flex-row items-start justify-between">
                                <View className="flex-1 pr-3">
                                    <Text className="text-sm font-semibold text-gray-800">
                                        AREA
                                    </Text>

                                    <Text className="mt-1 text-sm text-gray-600">
                                        Alberta Real Estate Association
                                    </Text>
                                </View>

                                <View className="w-[135px]">
                                    <Text className="mb-1.5 text-xs font-medium text-gray-600">
                                        Agreement Number
                                    </Text>

                                    <TextInput
                                        value={
                                            formData.agreementNumber
                                        }
                                        onChangeText={(value) =>
                                            updateField(
                                                "agreementNumber",
                                                value
                                            )
                                        }
                                        placeholder="Agreement #"
                                        placeholderTextColor="#9ca3af"
                                        className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800"
                                    />
                                </View>
                            </View>

                            <View className="border-t border-gray-100 pt-4">
                                <Text className="text-center text-lg font-bold text-gray-800">
                                    EXCLUSIVE BUYER
                                    {"\n"}
                                    REPRESENTATION AGREEMENT
                                </Text>

                                <Text className="mt-2 text-center text-sm text-gray-600">
                                    An Agreement to Exclusively Represent a Buyer
                                </Text>

                                <Text className="mt-1 text-center text-xs font-medium text-red-500">
                                    (For Use in Designated Agency Brokerages)
                                </Text>

                                <Text className="mt-3 text-center text-sm font-medium text-gray-700">
                                    Between
                                </Text>
                            </View>
                        </Card>

                        {/* BROKERAGE */}

                        <Card>
                            <Text className="mb-4 text-base font-bold text-gray-800">
                                THE BROKERAGE (WE)
                            </Text>

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
                                placeholder="Name"
                                maxLength={100}
                            />

                            <Field
                                label="Second Brokerage Name"
                                value={
                                    formData.brokerageName2
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "brokerageName2",
                                        value
                                    )
                                }
                                placeholder="Name"
                                maxLength={100}
                            />
                        </Card>

                        {/* BUYER */}

                        <Card>
                            <Text className="mb-4 text-base font-bold text-gray-800">
                                THE BUYER (YOU)
                            </Text>

                            <Field
                                label="Buyer 1"
                                value={
                                    formData.buyerName1
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "buyerName1",
                                        value
                                    )
                                }
                                placeholder="Name"
                                maxLength={80}
                            />

                            <Field
                                label="Buyer 2"
                                value={
                                    formData.buyerName2
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "buyerName2",
                                        value
                                    )
                                }
                                placeholder="Name"
                                maxLength={80}
                            />
                        </Card>

                        {/* PROPERTY */}

                        <Card>
                            <SectionTitle
                                number="1"
                                title="THE PROPERTY (SEARCH CRITERIA)"
                            />

                            <Field
                                label="Property Type"
                                value={
                                    formData.propertyType
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "propertyType",
                                        value
                                    )
                                }
                                placeholder="Property Type"
                                maxLength={100}
                            />

                            <Field
                                label="Market Areas"
                                value={
                                    formData.marketAreas
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "marketAreas",
                                        value
                                    )
                                }
                                placeholder="Market Areas"
                                maxLength={100}
                            />
                        </Card>

                        {/* AGENCY */}

                        <Card>
                            <SectionTitle
                                number="2"
                                title="OUR AGENCY RELATIONSHIP"
                            />

                            <Field
                                label="Designated Agent Name"
                                value={
                                    formData.designatedAgentName
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "designatedAgentName",
                                        value
                                    )
                                }
                                placeholder="Designated Agent Name"
                                maxLength={150}
                            />

                            <Text className="mb-2 mt-1 text-sm font-semibold text-gray-700">
                                Agreement begins on Date & Time
                            </Text>

                            <View className="mb-5 flex-row gap-2">
                                <SmallField
                                    label="Date"
                                    value={
                                        formData.startDate
                                    }
                                    onChangeText={(value) =>
                                        updateField(
                                            "startDate",
                                            value
                                        )
                                    }
                                    placeholder="MM/DD"
                                />

                                <SmallField
                                    label="Year"
                                    value={
                                        formData.startYear
                                    }
                                    onChangeText={(value) =>
                                        updateField(
                                            "startYear",
                                            value
                                        )
                                    }
                                    placeholder="YY"
                                    keyboardType="numeric"
                                />

                                <SmallField
                                    label="Time"
                                    value={
                                        formData.startTime
                                    }
                                    onChangeText={(value) =>
                                        updateField(
                                            "startTime",
                                            value
                                        )
                                    }
                                    placeholder="HH:MM"
                                />
                            </View>

                            <Text className="mb-2 text-sm font-semibold text-gray-700">
                                End Date & Time
                            </Text>

                            <View className="flex-row gap-2">
                                <SmallField
                                    label="Date"
                                    value={
                                        formData.endDate
                                    }
                                    onChangeText={(value) =>
                                        updateField(
                                            "endDate",
                                            value
                                        )
                                    }
                                    placeholder="MM/DD"
                                />

                                <SmallField
                                    label="Year"
                                    value={
                                        formData.endYear
                                    }
                                    onChangeText={(value) =>
                                        updateField(
                                            "endYear",
                                            value
                                        )
                                    }
                                    placeholder="YY"
                                    keyboardType="numeric"
                                />

                                <SmallField
                                    label="Time"
                                    value={
                                        formData.endTime
                                    }
                                    onChangeText={(value) =>
                                        updateField(
                                            "endTime",
                                            value
                                        )
                                    }
                                    placeholder="HH:MM"
                                />
                            </View>
                        </Card>

                        {/* SERVICES */}

                        <Card>
                            <SectionTitle
                                number="5"
                                title="SERVICES"
                            />

                            <Field
                                label="Agent Service"
                                value={
                                    formData.agentServices
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "agentServices",
                                        value
                                    )
                                }
                                placeholder="Enter services..."
                                maxLength={500}
                                multiline
                            />
                        </Card>
                    </>
                ) : null}

                {/* =========================================
                    STEP 2
                ========================================= */}

                {step === 2 ? (
                    <>
                        <Card>
                            <SectionTitle
                                number="6"
                                title="YOUR RESPONSIBILITIES"
                            />

                            <Text className="mb-3 text-sm leading-6 text-gray-700">
                                6.2 During this agreement and
                            </Text>

                            <View className="flex-row flex-wrap items-center">
                                <Text className="text-sm text-gray-700">
                                    During this agreement and
                                </Text>

                                <TextInput
                                    value={
                                        formData.daysAfterAgreement
                                    }
                                    onChangeText={(value) =>
                                        updateField(
                                            "daysAfterAgreement",
                                            value
                                        )
                                    }
                                    placeholder="Days"
                                    placeholderTextColor="#9ca3af"
                                    keyboardType="numeric"
                                    className="mx-2 h-11 w-20 rounded-xl border border-gray-200 bg-white px-3 text-center text-gray-800"
                                />

                                <Text className="text-sm text-gray-700">
                                    days after this agreement ends.
                                </Text>
                            </View>
                        </Card>

                        <Card>
                            <SectionTitle
                                number="8"
                                title="OUR FEE, RETAINER, AND LIMITS ON PAYMENTS"
                            />

                            <Field
                                label="8.1 Our Fee (plus GST)"
                                value={
                                    formData.ourFee
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "ourFee",
                                        value
                                    )
                                }
                                placeholder="Our Fee"
                                maxLength={200}
                            />

                            <Text className="mb-3 text-sm font-semibold text-gray-700">
                                Retainer Details
                            </Text>

                            <View className="mb-4 flex-row items-end gap-2">
                                <View className="w-28">
                                    <Text className="mb-1.5 text-xs text-gray-600">
                                        Amount
                                    </Text>

                                    <TextInput
                                        value={
                                            formData.retainerAmount
                                        }
                                        onChangeText={(value) =>
                                            updateField(
                                                "retainerAmount",
                                                value
                                            )
                                        }
                                        placeholder="0.00"
                                        placeholderTextColor="#9ca3af"
                                        keyboardType="decimal-pad"
                                        className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-gray-800"
                                    />
                                </View>

                                <Text className="mb-3 text-sm text-gray-600">
                                    Payable by
                                </Text>
                            </View>

                            <View className="mb-5 flex-row gap-2">
                                <SmallField
                                    label="Month"
                                    value={
                                        formData.retainerMonth
                                    }
                                    onChangeText={(value) =>
                                        updateField(
                                            "retainerMonth",
                                            value
                                        )
                                    }
                                    placeholder="MM"
                                    keyboardType="numeric"
                                />

                                <SmallField
                                    label="Day"
                                    value={
                                        formData.retainerDay
                                    }
                                    onChangeText={(value) =>
                                        updateField(
                                            "retainerDay",
                                            value
                                        )
                                    }
                                    placeholder="DD"
                                    keyboardType="numeric"
                                />

                                <SmallField
                                    label="Year"
                                    value={
                                        formData.retainerYear
                                    }
                                    onChangeText={(value) =>
                                        updateField(
                                            "retainerYear",
                                            value
                                        )
                                    }
                                    placeholder="YY"
                                    keyboardType="numeric"
                                />
                            </View>

                            <View className="mb-5 flex-row items-center">
                                <Text className="text-sm text-gray-700">
                                    Refund within
                                </Text>

                                <TextInput
                                    value={
                                        formData.refundDays
                                    }
                                    onChangeText={(value) =>
                                        updateField(
                                            "refundDays",
                                            value
                                        )
                                    }
                                    placeholder="Days"
                                    placeholderTextColor="#9ca3af"
                                    keyboardType="numeric"
                                    className="mx-2 h-11 w-20 rounded-xl border border-gray-200 bg-white px-3 text-center text-gray-800"
                                />

                                <Text className="text-sm text-gray-700">
                                    days
                                </Text>
                            </View>

                            <Field
                                label="Other Payment Terms"
                                value={
                                    formData.otherPaymentTerms
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "otherPaymentTerms",
                                        value
                                    )
                                }
                                maxLength={180}
                                multiline
                            />

                            {/* CONDITIONS */}

                            <Text className="mb-3 mt-2 text-sm font-semibold text-gray-700">
                                Payment Conditions
                            </Text>

                            <View className="gap-4">
                                <InlineNumberField
                                    before="Within days agreement ends"
                                    value={
                                        formData.contractDaysAfterAgreement
                                    }
                                    onChange={(value) =>
                                        updateField(
                                            "contractDaysAfterAgreement",
                                            value
                                        )
                                    }
                                    after="days after agreement ends"
                                />

                                <InlineNumberField
                                    before="Pay within"
                                    value={
                                        formData.paymentAfterPurchaseDays
                                    }
                                    onChange={(value) =>
                                        updateField(
                                            "paymentAfterPurchaseDays",
                                            value
                                        )
                                    }
                                    after="days after purchase"
                                />

                                <InlineNumberField
                                    before="Refund difference within"
                                    value={
                                        formData.refundDifferenceDays
                                    }
                                    onChange={(value) =>
                                        updateField(
                                            "refundDifferenceDays",
                                            value
                                        )
                                    }
                                    after="days"
                                />

                                <InlineNumberField
                                    before="Pay remaining within"
                                    value={
                                        formData.differencePaymentDays
                                    }
                                    onChange={(value) =>
                                        updateField(
                                            "differencePaymentDays",
                                            value
                                        )
                                    }
                                    after="days"
                                />
                            </View>

                            <View className="mt-5">
                                <Field
                                    label="Reasonable Expenses"
                                    value={
                                        formData.reasonableExpenses
                                    }
                                    onChangeText={(value) =>
                                        updateField(
                                            "reasonableExpenses",
                                            value
                                        )
                                    }
                                    maxLength={260}
                                    multiline
                                />
                            </View>
                        </Card>
                    </>
                ) : null}

                {/* =========================================
                    STEP 3
                ========================================= */}

                {step === 3 ? (
                    <>
                        <Card>
                            <SectionTitle
                                number="13"
                                title="ADDITIONAL TERMS"
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
                                placeholder="Enter additional terms..."
                                maxLength={600}
                                multiline
                            />
                        </Card>

                        <Card>
                            <SectionTitle
                                number="15"
                                title="THIS AGREEMENT INCLUDES THESE ATTACHED DOCUMENTS"
                            />

                            <Field
                                label="Attached Documents"
                                value={
                                    formData.attachedDocuments
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "attachedDocuments",
                                        value
                                    )
                                }
                                placeholder="List attached documents..."
                                maxLength={300}
                                multiline
                            />
                        </Card>
                    </>
                ) : null}

                {/* =========================================
                    STEP 4
                ========================================= */}

                {step === 4 ? (
                    <>
                        {/* CONTACT INFORMATION */}

                        <Card>
                            <SectionTitle
                                title="CONTACT INFORMATION"
                            />

                            {/* BUYER 1 */}

                            <Text className="mb-4 text-base font-bold text-gray-800">
                                Buyer 1
                            </Text>

                            <Field
                                label="Buyer Name"
                                value={
                                    formData.buyer1Name
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "buyer1Name",
                                        value
                                    )
                                }
                                maxLength={80}
                                placeholder="Name"
                            />

                            <Field
                                label="Address"
                                value={
                                    formData.buyer1Address
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "buyer1Address",
                                        value
                                    )
                                }
                                maxLength={70}
                                placeholder="Address"
                            />

                            <View className="mb-4 flex-row gap-2">
                                <SmallField
                                    label="Phone"
                                    value={
                                        formData.buyer1Phone
                                    }
                                    onChangeText={(value) =>
                                        updateField(
                                            "buyer1Phone",
                                            value
                                        )
                                    }
                                    placeholder="Phone"
                                    keyboardType="phone-pad"
                                />

                                <SmallField
                                    label="Fax"
                                    value="-------------------"
                                    onChangeText={() => {}}
                                    disabled
                                />
                            </View>

                            <Field
                                label="Email"
                                value={
                                    formData.buyer1Email
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "buyer1Email",
                                        value
                                    )
                                }
                                maxLength={40}
                                placeholder="Email"
                                keyboardType="email-address"
                            />

                            {/* BUYER 2 */}

                            <View className="mt-5 border-t border-gray-100 pt-5">
                                <Text className="mb-4 text-base font-bold text-gray-800">
                                    Buyer 2
                                </Text>

                                <Field
                                    label="Buyer Name"
                                    value={
                                        formData.buyer2Name
                                    }
                                    onChangeText={(value) =>
                                        updateField(
                                            "buyer2Name",
                                            value
                                        )
                                    }
                                    maxLength={80}
                                    placeholder="Name"
                                />

                                <Field
                                    label="Address"
                                    value={
                                        formData.buyer2Address
                                    }
                                    onChangeText={(value) =>
                                        updateField(
                                            "buyer2Address",
                                            value
                                        )
                                    }
                                    maxLength={70}
                                    placeholder="Address"
                                />

                                <View className="mb-4 flex-row gap-2">
                                    <SmallField
                                        label="Phone"
                                        value={
                                            formData.buyer2Phone
                                        }
                                        onChangeText={(value) =>
                                            updateField(
                                                "buyer2Phone",
                                                value
                                            )
                                        }
                                        placeholder="Phone"
                                        keyboardType="phone-pad"
                                    />

                                    <SmallField
                                        label="Fax"
                                        value="-------------------"
                                        onChangeText={() => {}}
                                        disabled
                                    />
                                </View>

                                <Field
                                    label="Email"
                                    value={
                                        formData.buyer2Email
                                    }
                                    onChangeText={(value) =>
                                        updateField(
                                            "buyer2Email",
                                            value
                                        )
                                    }
                                    maxLength={40}
                                    placeholder="Email"
                                    keyboardType="email-address"
                                />
                            </View>
                        </Card>

                        {/* BROKERAGE */}

                        <Card>
                            <Text className="mb-4 text-base font-bold text-gray-800">
                                Brokerage
                            </Text>

                            <Field
                                label="Brokerage Name"
                                value={
                                    formData.brokerageName
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "brokerageName",
                                        value
                                    )
                                }
                                maxLength={100}
                                placeholder="Name"
                            />

                            <Field
                                label="Address"
                                value={
                                    formData.brokerageAddress
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "brokerageAddress",
                                        value
                                    )
                                }
                                maxLength={80}
                                placeholder="Address"
                            />

                            <View className="mb-4 flex-row gap-2">
                                <SmallField
                                    label="Phone"
                                    value={
                                        formData.brokeragePhone
                                    }
                                    onChangeText={(value) =>
                                        updateField(
                                            "brokeragePhone",
                                            value
                                        )
                                    }
                                    placeholder="Phone"
                                    keyboardType="phone-pad"
                                />

                                <SmallField
                                    label="Fax"
                                    value="-----------------"
                                    onChangeText={() => {}}
                                    disabled
                                />
                            </View>

                            <Field
                                label="Email"
                                value={
                                    formData.brokerageEmail
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "brokerageEmail",
                                        value
                                    )
                                }
                                maxLength={40}
                                placeholder="Email"
                                keyboardType="email-address"
                            />
                        </Card>

                        {/* REPRESENTATIVE */}

                        <Card>
                            <Text className="mb-4 text-base font-bold text-gray-800">
                                Representative
                            </Text>

                            <Field
                                label="Representative Name"
                                value={
                                    formData.repName
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "repName",
                                        value
                                    )
                                }
                                maxLength={100}
                                placeholder="Name"
                            />

                            <View className="mb-4 flex-row gap-2">
                                <SmallField
                                    label="Phone"
                                    value={
                                        formData.repPhone
                                    }
                                    onChangeText={(value) =>
                                        updateField(
                                            "repPhone",
                                            value
                                        )
                                    }
                                    placeholder="Phone"
                                    keyboardType="phone-pad"
                                />

                                <SmallField
                                    label="Fax"
                                    value="------------------"
                                    onChangeText={() => {}}
                                    disabled
                                />
                            </View>

                            <Field
                                label="Email"
                                value={
                                    formData.repEmail
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "repEmail",
                                        value
                                    )
                                }
                                maxLength={40}
                                placeholder="Email"
                                keyboardType="email-address"
                            />
                        </Card>

                        {/* SIGNATURES */}

                        <Card>
                            <SectionTitle
                                title="SIGNATURES"
                            />

                            {/* BUYER 1 */}

                            <Text className="mb-3 text-sm font-bold text-gray-800">
                                Buyer 1
                            </Text>

                            <Field
                                label="Buyer 1 Name"
                                value={
                                    formData.buyersig1
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "buyersig1",
                                        value
                                    )
                                }
                                placeholder="Buyer 1 Name"
                            />

                            <Field
                                label="Buyer 1 Email"
                                value={
                                    formData.buyerSignatureEmail1
                                }
                                onChangeText={(value) =>
                                    updateField(
                                        "buyerSignatureEmail1",
                                        value
                                    )
                                }
                                placeholder="Buyer 1 Email"
                                keyboardType="email-address"
                            />

                            {/* BUYER 2 */}

                            <View className="mt-4 border-t border-gray-100 pt-4">
                                <Text className="mb-3 text-sm font-bold text-gray-800">
                                    Buyer 2
                                </Text>

                                <Field
                                    label="Buyer 2 Name"
                                    value={
                                        formData.buyer2Name
                                    }
                                    onChangeText={(value) =>
                                        updateField(
                                            "buyer2Name",
                                            value
                                        )
                                    }
                                    placeholder="Buyer 2 Name"
                                />

                                {formData.buyer2Name.trim() ? (
                                    <Field
                                        label="Buyer 2 Email"
                                        value={
                                            formData.buyer2Email
                                        }
                                        onChangeText={(value) =>
                                            updateField(
                                                "buyer2Email",
                                                value
                                            )
                                        }
                                        placeholder="Buyer 2 Email"
                                        keyboardType="email-address"
                                    />
                                ) : null}
                            </View>

                            {/* WITNESS 1 */}

                            <View className="mt-4 border-t border-gray-100 pt-4">
                                <Text className="mb-3 text-sm font-bold text-gray-800">
                                    Witness 1
                                </Text>

                                <Field
                                    label="Witness 1"
                                    value={
                                        formData.witness1sig
                                    }
                                    onChangeText={(value) =>
                                        updateField(
                                            "witness1sig",
                                            value
                                        )
                                    }
                                    placeholder="Witness 1"
                                />

                                {formData.witness1sig.trim() ? (
                                    <Field
                                        label="Witness 1 Email"
                                        value={
                                            formData.witness1Email
                                        }
                                        onChangeText={(value) =>
                                            updateField(
                                                "witness1Email",
                                                value
                                            )
                                        }
                                        placeholder="Witness 1 Email"
                                        keyboardType="email-address"
                                    />
                                ) : null}
                            </View>

                            {/* WITNESS 2 */}

                            <View className="mt-4 border-t border-gray-100 pt-4">
                                <Text className="mb-3 text-sm font-bold text-gray-800">
                                    Witness 2
                                </Text>

                                <Field
                                    label="Witness 2"
                                    value={
                                        formData.witness2sig
                                    }
                                    onChangeText={(value) =>
                                        updateField(
                                            "witness2sig",
                                            value
                                        )
                                    }
                                    placeholder="Witness 2"
                                />

                                {formData.witness2sig.trim() ? (
                                    <Field
                                        label="Witness 2 Email"
                                        value={
                                            formData.witness2Email
                                        }
                                        onChangeText={(value) =>
                                            updateField(
                                                "witness2Email",
                                                value
                                            )
                                        }
                                        placeholder="Witness 2 Email"
                                        keyboardType="email-address"
                                    />
                                ) : null}
                            </View>

                            {/* AGENT */}

                            <View className="mt-4 border-t border-gray-100 pt-4">
                                <Text className="mb-3 text-sm font-bold text-gray-800">
                                    Agent
                                </Text>

                                <Field
                                    label="Agent Name"
                                    value={
                                        formData.agentsig
                                    }
                                    onChangeText={(value) =>
                                        updateField(
                                            "agentsig",
                                            value
                                        )
                                    }
                                    placeholder="Agent Name"
                                />
                            </View>
                        </Card>
                    </>
                ) : null}

                {/* =========================================
                    NAVIGATION
                ========================================= */}

                {isAdmin ? (
                    <View className="mt-2">
                        <View className="border-t border-gray-200 pt-4">
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

                            <View className="flex-row gap-3">
                                {step > 1 ? (
                                    <Pressable
                                        onPress={() =>
                                            setStep(
                                                (prev) =>
                                                    prev - 1
                                            )
                                        }
                                        className="h-12 flex-1 flex-row items-center justify-center rounded-xl border border-gray-200 bg-white active:bg-gray-100"
                                    >
                                        <Ionicons
                                            name="arrow-back"
                                            size={18}
                                            color="#374151"
                                        />

                                        <Text className="ml-2 font-semibold text-gray-700">
                                            Previous
                                        </Text>
                                    </Pressable>
                                ) : null}

                                {step < 4 ? (
                                    <Pressable
                                        onPress={() =>
                                            setStep(
                                                (prev) =>
                                                    prev + 1
                                            )
                                        }
                                        className="h-12 flex-1 flex-row items-center justify-center rounded-xl bg-blue-600 active:bg-blue-700"
                                    >
                                        <Text className="font-semibold text-white">
                                            Next
                                        </Text>

                                        <Ionicons
                                            name="arrow-forward"
                                            size={18}
                                            color="#ffffff"
                                            style={{
                                                marginLeft: 8,
                                            }}
                                        />
                                    </Pressable>
                                ) : (
                                    <Pressable
                                        disabled={saving}
                                        onPress={
                                            handleSubmit
                                        }
                                        className={[
                                            "h-12 flex-1 flex-row items-center justify-center rounded-xl",
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
                                            size={18}
                                            color="#ffffff"
                                        />

                                        <Text className="ml-2 font-semibold text-white">
                                            {saving
                                                ? "Saving..."
                                                : "Save"}
                                        </Text>
                                    </Pressable>
                                )}
                            </View>
                        </View>
                    </View>
                ) : null}
            </ScrollView>
        </View>
    );
}

/* =========================================================
   INLINE NUMBER FIELD
========================================================= */

function InlineNumberField({
    before,
    value,
    onChange,
    after,
}: {
    before: string;
    value: string;
    onChange: (value: string) => void;
    after: string;
}) {
    return (
        <View className="flex-row flex-wrap items-center">
            <Text className="text-sm leading-6 text-gray-700">
                {before}
            </Text>

            <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Days"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                className="mx-2 h-11 w-20 rounded-xl border border-gray-200 bg-white px-3 text-center text-gray-800"
            />

            <Text className="text-sm leading-6 text-gray-700">
                {after}
            </Text>
        </View>
    );
}