import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

/* ============================================================
   TRANSACTION USER
============================================================ */

interface TransactionUser {
  id?: string;
  _id?: string;
  userId?: string;
  name?: string;
  email?: string;
  role?: string;
  isSuperAdmin?: boolean;
}

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

/* ============================================================
   FORM TYPE
============================================================ */

type FormData = {
  agreementNumber: string;
  listingContractNumber: string;

  sellerLastName1: string;
  sellerFirstName1: string;

  sellerLastName2: string;
  sellerFirstName2: string;

  brokerageName: string;
  brokerageRepName: string;

  streetNum: string;
  street: string;
  unitNum: string;
  city: string;
  state: string;
  zipCode: string;

  plan: string;
  block: string;
  lotUnit: string;

  sellerSignDate: string;

  sellerPrint1: string;
  sellerPrint2: string;

  witness1: string;
  witness2: string;

  brokerageSignDate: string;
  repPrintName: string;

  sellerSignatureEmail1: string;
  sellerSignatureEmail2: string;

  witnessEmail1: string;
  witnessEmail2: string;

  brokerEmail: string;
};

/* ============================================================
   INITIAL FORM
============================================================ */

const initialFormData: FormData = {
  agreementNumber: "",
  listingContractNumber: "",

  sellerLastName1: "",
  sellerFirstName1: "",

  sellerLastName2: "",
  sellerFirstName2: "",

  brokerageName: "",
  brokerageRepName: "",

  streetNum: "",
  street: "",
  unitNum: "",
  city: "",
  state: "",
  zipCode: "",

  plan: "",
  block: "",
  lotUnit: "",

  sellerSignDate: "",

  sellerPrint1: "",
  sellerPrint2: "",

  witness1: "",
  witness2: "",

  brokerageSignDate: "",
  repPrintName: "",

  sellerSignatureEmail1: "",
  sellerSignatureEmail2: "",

  witnessEmail1: "",
  witnessEmail2: "",

  brokerEmail: "",
};

/* ============================================================
   SAFE STRING
============================================================ */

const safeString = (value: unknown): string => {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value);
};

/* ============================================================
   FIELD COMPONENT
============================================================ */

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  maxLength,
  keyboardType = "default",
  editable = true,
}: {
  label: string;
  value: string | undefined | null;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  keyboardType?: any;
  editable?: boolean;
}) {
  const safeValue = safeString(value);

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-gray-700">
        {label}
      </Text>

      <TextInput
        value={safeValue}
        onChangeText={(text) => {
          const nextValue = maxLength
            ? text.slice(0, maxLength)
            : text;

          onChangeText(nextValue);
        }}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType}
        editable={editable}
        className={`rounded-xl border px-4 py-3.5 text-base ${
          editable
            ? "border-gray-200 bg-white text-gray-900"
            : "border-gray-200 bg-gray-100 text-gray-500"
        }`}
      />

      {maxLength ? (
        <Text className="mt-1 text-right text-xs text-gray-400">
          {safeValue.length}/{maxLength}
        </Text>
      ) : null}
    </View>
  );
}

/* ============================================================
   SECTION
============================================================ */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-6 rounded-2xl bg-white p-5">
      <View className="mb-5 border-b border-gray-200 pb-3">
        <Text className="text-lg font-bold text-gray-900">
          {title}
        </Text>
      </View>

      {children}
    </View>
  );
}

/* ============================================================
   SIGNATURE PLACEHOLDER
============================================================ */

function SignaturePlaceholder({
  label,
}: {
  label: string;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-gray-700">
        {label}
      </Text>

      <View className="rounded-xl border border-gray-200 bg-gray-100 px-4 py-3.5">
        <Text className="text-gray-400">
          Signature
        </Text>
      </View>
    </View>
  );
}

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function IDMMGOL() {
  const router = useRouter();

  const { id, mode } =
    useLocalSearchParams<{
      id?: string;
      mode?: string;
    }>();

  const isAdmin = mode === "admin";

  const { user } = useAuth();

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [formData, setFormData] =
    useState<FormData>(initialFormData);

  /* ==========================================================
     UPDATE FIELD
  ========================================================== */

  const updateField = (
    field: keyof FormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value ?? "",
    }));
  };

  /* ==========================================================
     ADMIN TRANSACTION USER BRIDGE
  ========================================================== */

  const getAdminTransactionUserId =
    async (): Promise<string> => {
      if (!user?.email) {
        throw new Error(
          "Admin email not found."
        );
      }

      const response = await fetch(
        `${API_BASE}/transactions/check-super-admin/${encodeURIComponent(
          user.email
        )}`
      );

      let data: any = null;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "Invalid authentication response."
        );
      }

      if (
        !response.ok ||
        !data?.success ||
        !data?.isSuperAdmin
      ) {
        throw new Error(
          data?.message ||
            "You do not have transaction panel access."
        );
      }

      const transactionUser =
        data.user ||
        data.transactionUser ||
        data.admin ||
        data;

      const transactionUserId =
        getTransactionUserId(
          transactionUser
        );

      if (!transactionUserId) {
        throw new Error(
          "Transaction user ID could not be resolved."
        );
      }

      return transactionUserId;
    };

  /* ==========================================================
     LOAD DATA
  ========================================================== */

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      let timeout: ReturnType<
        typeof setTimeout
      > | null = null;

      try {
        setLoading(true);

        const controller =
          new AbortController();

        timeout = setTimeout(() => {
          controller.abort();
        }, 15000);

        const [
          partyRes,
          transactionRes,
          adminRes,
          idmmgolRes,
        ] = await Promise.all([
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
            `${API_BASE}/idmmgol/user/${id}`,
            {
              signal:
                controller.signal,
            }
          ),
        ]);

        if (timeout) {
          clearTimeout(timeout);
        }

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
          partyJson,
          transactionJson,
          adminJson,
          idmmgolJson,
        ] = await Promise.all([
          parseJSON(partyRes),
          parseJSON(transactionRes),
          parseJSON(adminRes),
          parseJSON(idmmgolRes),
        ]);

        if (
          !partyRes.ok ||
          !transactionRes.ok ||
          !adminRes.ok ||
          !idmmgolRes.ok
        ) {
          throw new Error(
            "Failed to load data."
          );
        }

        const partysettings =
          partyJson?.data || {};

        const transactionsettings =
          transactionJson?.data || {};

        const settings =
          adminJson?.data || {};

        const cleanData =
          idmmgolJson?.data || {};

        /* ====================================================
           IDENTITY DATA
        ==================================================== */

        const passport =
          partysettings?.identityData
            ?.passport?.fullName
            ? partysettings
                .identityData.passport
            : null;

        const license =
          partysettings?.identityData
            ?.license?.fullName
            ? partysettings
                .identityData.license
            : null;

        const sellerFullName =
          safeString(
            passport?.fullName ||
              license?.fullName ||
              partysettings?.name ||
              ""
          );

        const nameParts =
          sellerFullName
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        const firstName =
          nameParts[0] || "";

        const lastName =
          nameParts
            .slice(1)
            .join(" ") || "";

        /* ====================================================
           PICK FUNCTION
        ==================================================== */

        const pick = (
          ...values: unknown[]
        ): string => {
          const found =
            values.find(
              (value) =>
                value !== undefined &&
                value !== null &&
                value !== ""
            );

          return safeString(found);
        };

        /* ====================================================
           CLEAN BACKEND DATA
           
           Remove undefined/null values before
           merging into form state.
        ==================================================== */

        const cleanedBackendData =
          Object.fromEntries(
            Object.entries(
              cleanData || {}
            ).filter(
              ([, value]) =>
                value !== undefined &&
                value !== null
            )
          );

        /* ====================================================
           SECOND SELLER NAME
        ==================================================== */

        const secondSellerFirstName =
          pick(
            cleanData?.sellerFirstName2,
            ""
          );

        const secondSellerLastName =
          pick(
            cleanData?.sellerLastName2,
            ""
          );

        const secondSellerName =
          `${secondSellerFirstName} ${secondSellerLastName}`.trim();

        /* ====================================================
           SET FORM
        ==================================================== */

        setFormData((prev) => ({
          ...prev,

          ...cleanedBackendData,

          /* Brokerage */

          brokerageName: pick(
            cleanData?.brokerageName,
            prev.brokerageName,
            settings?.brokerageName,
            ""
          ),

          brokerageRepName: pick(
            cleanData?.brokerageRepName,
            prev.brokerageRepName,
            settings?.repName,
            ""
          ),

          repPrintName: pick(
            cleanData?.repPrintName,
            prev.repPrintName,
            settings?.repName,
            ""
          ),

          /* Seller 1 */

          sellerFirstName1: pick(
            cleanData?.sellerFirstName1,
            prev.sellerFirstName1,
            firstName,
            ""
          ),

          sellerLastName1: pick(
            cleanData?.sellerLastName1,
            prev.sellerLastName1,
            lastName,
            ""
          ),

          sellerPrint1: pick(
            cleanData?.sellerPrint1,
            prev.sellerPrint1,
            sellerFullName,
            ""
          ),

          /* Seller 2 */

          sellerFirstName2: pick(
            cleanData?.sellerFirstName2,
            prev.sellerFirstName2,
            ""
          ),

          sellerLastName2: pick(
            cleanData?.sellerLastName2,
            prev.sellerLastName2,
            ""
          ),

          sellerPrint2: pick(
            cleanData?.sellerPrint2,
            prev.sellerPrint2,
            secondSellerName,
            ""
          ),

          /* Agreement */

          agreementNumber: pick(
            cleanData?.agreementNumber,
            prev.agreementNumber,
            transactionsettings?.agreementnumber,
            ""
          ),

          listingContractNumber: pick(
            cleanData?.listingContractNumber,
            prev.listingContractNumber,
            transactionsettings?.agreementnumber,
            ""
          ),

          /* Emails */

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
        }));
      } catch (error: any) {
        console.error(
          "IDMMGOL LOAD ERROR:",
          error
        );

        if (
          error?.name ===
          "AbortError"
        ) {
          Alert.alert(
            "Timeout",
            "Request timed out while loading the form."
          );
        } else {
          Alert.alert(
            "Error",
            error?.message ||
              "Failed to load IDMMGOL data."
          );
        }
      } finally {
        if (timeout) {
          clearTimeout(timeout);
        }

        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  /* ==========================================================
     SUBMIT
  ========================================================== */

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

      /* ======================================================
         ADMIN ACCESS CHECK
      ====================================================== */

      if (isAdmin) {
        await getAdminTransactionUserId();
      }

      /* ======================================================
         PAYLOAD
      ====================================================== */

      const payload = {
        ...formData,

        partyId: id,

        sendEmail,

        isAdmin,
      };

      console.log(
        "IDMMGOL PAYLOAD:",
        payload
      );

      /* ======================================================
         REQUEST
      ====================================================== */

      const controller =
        new AbortController();

      const timeout = setTimeout(() => {
        controller.abort();
      }, 20000);

      const response = await fetch(
        `${API_BASE}/idmmgol/generate-pdf`,
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

      /* ======================================================
         ERROR RESPONSE
      ====================================================== */

      if (!response.ok) {
        let message =
          "Request failed.";

        try {
          const errorData =
            await response.json();

          message =
            errorData?.message ||
            errorData?.error ||
            message;
        } catch {
          // Ignore invalid error body
        }

        throw new Error(message);
      }

      /* ======================================================
         CONTENT TYPE
      ====================================================== */

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      /* ======================================================
         ADMIN → PDF
      ====================================================== */

      if (
        contentType.includes(
          "application/pdf"
        )
      ) {
        /*
         * Mobile doesn't use browser blob
         * download.
         *
         * We consume the PDF response so
         * the request completes successfully.
         */
        await response.arrayBuffer();

        Alert.alert(
          "Success",
          "IDMMGOL updated successfully ✅"
        );

        return;
      }

      /* ======================================================
         NORMAL USER → JSON
      ====================================================== */

      let data: any = null;

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          "Invalid server response."
        );
      }

      if (
        data?.success === false
      ) {
        throw new Error(
          data?.message ||
            "Failed to save IDMMGOL."
        );
      }

      Alert.alert(
        "Success",
        "Illegal Drug Manufacture / Marijuana Grow Operation Addendum saved ✅"
      );
    } catch (error: any) {
      console.error(
        "IDMMGOL SUBMIT ERROR:",
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

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator
          size="large"
          color="#2563eb"
        />

        <Text className="mt-4 text-gray-500">
          Loading IDMMGOL...
        </Text>
      </View>
    );
  }

  /* ==========================================================
     SCREEN
  ========================================================== */

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 60,
        }}
      >


        {/* ==================================================
            TITLE
        =================================================== */}

        <View className="mb-6">
          <Text className="text-2xl font-bold leading-8 text-gray-900">
            Illegal Drug Manufacture /
            Marijuana Grow Operation
            Addendum
          </Text>

          <Text className="mt-2 text-sm leading-5 text-gray-500">
            Complete the property and seller
            information below.
          </Text>
        </View>


        {/* ==================================================
            ADMIN MODE
        =================================================== */}

        {/* {isAdmin && (
          <View className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <View className="flex-row items-center">
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#2563eb"
              />

              <Text className="ml-2 flex-1 text-sm font-semibold text-blue-700">
                Admin Mode – You can edit but
                not change workflow
              </Text>
            </View>
          </View>
        )} */}

        {/* ==================================================
            AGREEMENT
        =================================================== */}

        <Section title="Agreement">
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
            maxLength={40}
          />

          <Field
            label="Real Estate Listing Contract #"
            value={
              formData.listingContractNumber
            }
            onChangeText={(value) =>
              updateField(
                "listingContractNumber",
                value
              )
            }
            placeholder="Listing Contract Number"
            maxLength={40}
          />
        </Section>

        {/* ==================================================
            SELLER
        =================================================== */}

        <Section title="The Seller">
          <Text className="mb-4 text-base font-bold text-gray-800">
            Seller 1
          </Text>

          <Field
            label="Seller First Name"
            value={
              formData.sellerFirstName1
            }
            onChangeText={(value) =>
              updateField(
                "sellerFirstName1",
                value
              )
            }
            placeholder="First Name"
            maxLength={60}
          />

          <Field
            label="Seller Last Name"
            value={
              formData.sellerLastName1
            }
            onChangeText={(value) =>
              updateField(
                "sellerLastName1",
                value
              )
            }
            placeholder="Last Name"
            maxLength={60}
          />

          <View className="mt-2 border-t border-gray-100 pt-5">
            <Text className="mb-4 text-base font-bold text-gray-800">
              Seller 2
            </Text>
          </View>

          <Field
            label="Seller First Name"
            value={
              formData.sellerFirstName2
            }
            onChangeText={(value) =>
              updateField(
                "sellerFirstName2",
                value
              )
            }
            placeholder="First Name"
            maxLength={60}
          />

          <Field
            label="Seller Last Name"
            value={
              formData.sellerLastName2
            }
            onChangeText={(value) =>
              updateField(
                "sellerLastName2",
                value
              )
            }
            placeholder="Last Name"
            maxLength={60}
          />
        </Section>

        {/* ==================================================
            BROKERAGE
        =================================================== */}

        <Section title="Brokerage">
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
            placeholder="Brokerage Name"
            editable={false}
          />

          <Field
            label="Brokerage Representative Name"
            value={
              formData.brokerageRepName
            }
            onChangeText={(value) =>
              updateField(
                "brokerageRepName",
                value
              )
            }
            placeholder="Broker / Agent Name"
            editable={false}
          />
        </Section>

        {/* ==================================================
            PROPERTY
        =================================================== */}

        <Section title="Property">
          <Field
            label="Street Number"
            value={formData.streetNum}
            onChangeText={(value) =>
              updateField(
                "streetNum",
                value
              )
            }
            placeholder="Street Number"
            maxLength={10}
          />

          <Field
            label="Street"
            value={formData.street}
            onChangeText={(value) =>
              updateField(
                "street",
                value
              )
            }
            placeholder="Street"
            maxLength={60}
          />

          <Field
            label="Unit Number"
            value={formData.unitNum}
            onChangeText={(value) =>
              updateField(
                "unitNum",
                value
              )
            }
            placeholder="Unit Number"
            maxLength={10}
          />

          <Field
            label="City"
            value={formData.city}
            onChangeText={(value) =>
              updateField(
                "city",
                value
              )
            }
            placeholder="City"
            maxLength={40}
          />

          <Field
            label="State"
            value={formData.state}
            onChangeText={(value) =>
              updateField(
                "state",
                value
              )
            }
            placeholder="State"
            maxLength={2}
          />

          <Field
            label="Zip Code"
            value={formData.zipCode}
            onChangeText={(value) =>
              updateField(
                "zipCode",
                value
              )
            }
            placeholder="Zip Code"
            maxLength={10}
          />

          <View className="mt-2 border-t border-gray-100 pt-5">
            <Text className="mb-4 text-base font-bold text-gray-800">
              Legal Description
            </Text>
          </View>

          <Field
            label="Plan"
            value={formData.plan}
            onChangeText={(value) =>
              updateField(
                "plan",
                value
              )
            }
            placeholder="Plan"
            maxLength={60}
          />

          <Field
            label="Block"
            value={formData.block}
            onChangeText={(value) =>
              updateField(
                "block",
                value
              )
            }
            placeholder="Block"
            maxLength={40}
          />

          <Field
            label="Lot / Unit"
            value={formData.lotUnit}
            onChangeText={(value) =>
              updateField(
                "lotUnit",
                value
              )
            }
            placeholder="Lot / Unit"
            maxLength={40}
          />
        </Section>

        {/* ==================================================
            DECLARATION
        =================================================== */}

        <View className="mb-6 rounded-2xl border border-gray-200 bg-white p-5">
          <Text className="text-sm font-medium leading-6 text-gray-700">
            I/We hereby declare that, to the
            best of my/our knowledge and
            belief, the property has not been
            used for the manufacture of illegal
            drugs or as a marijuana grow
            operation.
          </Text>
        </View>

        {/* ==================================================
            SELLER SIGNATURES
        =================================================== */}

        <Section title="Seller Signatures">
          {/* Seller 1 */}

          <View className="mb-8">
            <Text className="mb-4 text-base font-bold text-gray-800">
              Seller 1
            </Text>

            <SignaturePlaceholder
              label="Seller Signature"
            />

            <Field
              label="Print Name"
              value={
                formData.sellerPrint1
              }
              onChangeText={(value) =>
                updateField(
                  "sellerPrint1",
                  value
                )
              }
              placeholder="Print Name"
              maxLength={80}
            />

            {(safeString(
              formData.sellerPrint1
            ) || "")
              .trim()
              .length > 0 ? (
              <Field
                label="Seller Email"
                value={
                  formData.sellerSignatureEmail1
                }
                onChangeText={(value) =>
                  updateField(
                    "sellerSignatureEmail1",
                    value
                  )
                }
                placeholder="Seller Email"
                keyboardType="email-address"
              />
            ) : null}

            <SignaturePlaceholder
              label="Witness Signature"
            />

            <Field
              label="Witness Name"
              value={
                formData.witness1
              }
              onChangeText={(value) =>
                updateField(
                  "witness1",
                  value
                )
              }
              placeholder="Witness Name"
              maxLength={80}
            />

            {(safeString(
              formData.witness1
            ) || "")
              .trim()
              .length > 0 ? (
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

          {/* Seller 2 */}

          <View className="border-t border-gray-100 pt-6">
            <Text className="mb-4 text-base font-bold text-gray-800">
              Seller 2
            </Text>

            <SignaturePlaceholder
              label="Seller Signature"
            />

            <Field
              label="Print Name"
              value={
                formData.sellerPrint2
              }
              onChangeText={(value) =>
                updateField(
                  "sellerPrint2",
                  value
                )
              }
              placeholder="Print Name"
              maxLength={80}
            />

            {(safeString(
              formData.sellerPrint2
            ) || "")
              .trim()
              .length > 0 ? (
              <Field
                label="Seller Email"
                value={
                  formData.sellerSignatureEmail2
                }
                onChangeText={(value) =>
                  updateField(
                    "sellerSignatureEmail2",
                    value
                  )
                }
                placeholder="Seller Email"
                keyboardType="email-address"
              />
            ) : null}

            <SignaturePlaceholder
              label="Witness Signature"
            />

            <Field
              label="Witness Name"
              value={
                formData.witness2
              }
              onChangeText={(value) =>
                updateField(
                  "witness2",
                  value
                )
              }
              placeholder="Witness Name"
              maxLength={80}
            />

            {(safeString(
              formData.witness2
            ) || "")
              .trim()
              .length > 0 ? (
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
                placeholder="Witness Email"
                keyboardType="email-address"
              />
            ) : null}
          </View>
        </Section>

        {/* ==================================================
            BROKERAGE REPRESENTATIVE
        =================================================== */}

        <Section title="Brokerage Representative">
          <SignaturePlaceholder
            label="Signature"
          />

          <Field
            label="Broker Name"
            value={
              formData.repPrintName
            }
            onChangeText={(value) =>
              updateField(
                "repPrintName",
                value
              )
            }
            placeholder="Broker Name"
          />
        </Section>

        {/* ==================================================
            ADMIN BUTTONS
        =================================================== */}

        {isAdmin && (
          <View className="mb-4 border-t border-gray-200 pt-5">
            {/* PARTY DOCS */}

            <Pressable
              disabled={saving}
              onPress={() => {
                router.push(
                  `/(transactions)/partypdfdata/${id}` as any
                );
              }}
              className="mb-3 flex-row items-center justify-center rounded-xl bg-gray-200 px-5 py-4 active:opacity-80"
            >
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#374151"
              />

              <Text className="ml-2 font-semibold text-gray-700">
                Party Docs List
              </Text>
            </Pressable>

            {/* SAVE */}

            <Pressable
              disabled={saving}
              onPress={() =>
                handleSubmit(false)
              }
              className={`flex-row items-center justify-center rounded-xl px-5 py-4 ${
                saving
                  ? "bg-green-400"
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
                  name="save-outline"
                  size={20}
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
        )}
      </ScrollView>
    </View>
  );
}