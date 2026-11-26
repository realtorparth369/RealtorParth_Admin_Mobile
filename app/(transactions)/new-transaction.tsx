import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  FileText,
  MapPin,
  Hash,
  NotebookPen,
} from "lucide-react-native";
import { useAuth } from "../../contexts/AuthContext";
const API_URL = "https://realtorparth.ca";
const CURRENT_TRANSACTION_KEY = "currentTransactionId";
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
  _id?: string;
  id?: string;
  name?: string;
  transactionName?: string;
  propertyAddress?: string;
  agreementnumber?: string;
  notes?: string;
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
    return transactionUser.id.trim();
  }
  if (
    typeof transactionUser._id === "string" &&
    transactionUser._id.trim()
  ) {
    return transactionUser._id.trim();
  }
  if (
    typeof transactionUser.userId === "string" &&
    transactionUser.userId.trim()
  ) {
    return transactionUser.userId.trim();
  }
  return null;
};
const getValidTransactionId = (
  id: string | null
): string | null => {
  if (!id || typeof id !== "string") {
    return null;
  }
  const trimmedId = id.trim();
  if (!trimmedId) {
    return null;
  }
  if (!/^[a-fA-F0-9]{24}$/.test(trimmedId)) {
    return null;
  }
  return trimmedId;
};
export default function CreateTransaction() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode?: string | string[];
  }>();
  const { user, loading: authLoading } = useAuth();
  const [transactionId, setTransactionId] =
    useState<string | null>(null);
  const [transactionUserId, setTransactionUserId] =
    useState<string | null>(null);
  const [formData, setFormData] = useState({
    transactionName: "",
    propertyAddress: "",
    agreementnumber: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingTransaction, setLoadingTransaction] =
    useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const resolveTransactionUser =
    async (): Promise<string | null> => {
      if (!user?.email) {
        throw new Error(
          "Admin user not found. Please login again."
        );
      }
      const adminEmail = user.email.trim();
      if (!adminEmail) {
        throw new Error(
          "Admin email not found. Please login again."
        );
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
      }, 10000);
      try {
        const response = await fetch(
          `${API_URL}/api/transactions/check-super-admin/${encodeURIComponent(
            adminEmail
          )}`,
          {
            method: "GET",
            signal: controller.signal,
          }
        );
        let data: any;
        try {
          data = await response.json();
        } catch {
          throw new Error("Invalid server response.");
        }
        if (!response.ok) {
          throw new Error(
            data?.message || `Error ${response.status}`
          );
        }
        if (!data?.success) {
          throw new Error(
            data?.message ||
              "Unable to verify transaction access."
          );
        }
        if (!data?.isSuperAdmin) {
          throw new Error(
            "You do not have permission to access the Transaction Panel."
          );
        }
        const transactionUser:
          | TransactionUser
          | null =
          data?.user ||
          data?.transactionUser ||
          data?.admin ||
          data;
        const id =
          getTransactionUserId(transactionUser);
        if (!id) {
          throw new Error(
            "Transaction user ID was not returned by the server."
          );
        }
        setTransactionUserId(id);
        return id;
      } finally {
        clearTimeout(timeout);
      }
    };
  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user?.email) {
      setLoadingTransaction(false);
      setErrorMessage(
        "Admin user not found. Please login again."
      );
      return;
    }
    let isMounted = true;
    const loadTransaction = async () => {
      try {
        setLoadingTransaction(true);
        setErrorMessage("");
        const routeModeValue = Array.isArray(params?.mode)
          ? params.mode[0]
          : params?.mode;
        const routeMode =
          typeof routeModeValue === "string"
            ? routeModeValue.trim().toLowerCase()
            : "";
        console.log(
          "========================================"
        );
        console.log(
          "CREATE TRANSACTION SCREEN"
        );
        console.log("Route mode:", routeMode);
        console.log(
          "========================================"
        );
        const resolvedUserId =
          await resolveTransactionUser();
        if (!resolvedUserId) {
          throw new Error(
            "Transaction user not found."
          );
        }
        if (routeMode === "create") {
          console.log(
            "CREATE MODE DETECTED"
          );
          await AsyncStorage.removeItem(
            CURRENT_TRANSACTION_KEY
          );
          if (!isMounted) {
            return;
          }
          setTransactionId(null);
          setIsEditMode(false);
          setFormData({
            transactionName: "",
            propertyAddress: "",
            agreementnumber: "",
            notes: "",
          });
          return;
        }
        const storedTransactionId =
          await AsyncStorage.getItem(
            CURRENT_TRANSACTION_KEY
          );
        console.log(
          "Stored transaction ID:",
          storedTransactionId
        );
        const validTransactionId =
          getValidTransactionId(
            storedTransactionId
          );
        if (!validTransactionId) {
          console.log(
            "No valid transaction ID found."
          );
          if (storedTransactionId) {
            await AsyncStorage.removeItem(
              CURRENT_TRANSACTION_KEY
            );
          }
          if (!isMounted) {
            return;
          }
          setTransactionId(null);
          setIsEditMode(false);
          setFormData({
            transactionName: "",
            propertyAddress: "",
            agreementnumber: "",
            notes: "",
          });
          return;
        }
        const id = validTransactionId;
        await AsyncStorage.setItem(
          CURRENT_TRANSACTION_KEY,
          id
        );
        if (!isMounted) {
          return;
        }
        setTransactionId(id);
        const controller =
          new AbortController();
        const timeout = setTimeout(() => {
          controller.abort();
        }, 10000);
        try {
          const response = await fetch(
            `${API_URL}/api/transactions/${encodeURIComponent(
              id
            )}/${encodeURIComponent(
              resolvedUserId
            )}`,
            {
              method: "GET",
              signal: controller.signal,
            }
          );
          let data: any;
          try {
            data = await response.json();
          } catch {
            throw new Error(
              "Invalid server response."
            );
          }
          console.log(
            "Transaction response:",
            data
          );
          if (response.status === 404) {
            await AsyncStorage.removeItem(
              CURRENT_TRANSACTION_KEY
            );
            if (!isMounted) {
              return;
            }
            setTransactionId(null);
            setIsEditMode(false);
            setFormData({
              transactionName: "",
              propertyAddress: "",
              agreementnumber: "",
              notes: "",
            });
            return;
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
                "Failed to load transaction."
            );
          }
          const transaction:
            | Transaction
            | null =
            data?.transaction || null;
          if (!transaction) {
            throw new Error(
              "Transaction data not found."
            );
          }
          if (!isMounted) {
            return;
          }
          setFormData({
            transactionName:
              transaction.transactionName ||
              transaction.name ||
              "",
            propertyAddress:
              transaction.propertyAddress ||
              "",
            agreementnumber:
              transaction.agreementnumber ||
              "",
            notes:
              transaction.notes ||
              "",
          });
          if (routeMode === "edit") {
            console.log(
              "========================================"
            );
            console.log(
              "EDIT MODE ACTIVE"
            );
            console.log(
              "Staying on Edit Transaction screen."
            );
            console.log(
              "NO REDIRECT TO PARTIES."
            );
            console.log(
              "========================================"
            );
            setIsEditMode(true);
            return;
          }
          console.log(
            "No edit mode. Existing transaction -> Parties."
          );
          setIsEditMode(false);
          router.replace(
            "/(transactions)/parties" as any
          );
        } finally {
          clearTimeout(timeout);
        }
      } catch (error: any) {
        console.error(
          "Load Transaction Error:",
          error
        );
        if (!isMounted) {
          return;
        }
        if (
          error?.name === "AbortError"
        ) {
          setErrorMessage(
            "Request timed out. Please try again."
          );
        } else if (
          error?.name === "TypeError"
        ) {
          setErrorMessage(
            "Server down or network error."
          );
        } else {
          setErrorMessage(
            error?.message ||
              "Failed to load transaction."
          );
        }
      } finally {
        if (isMounted) {
          setLoadingTransaction(false);
        }
      }
    };
    loadTransaction();
    return () => {
      isMounted = false;
    };
  }, [
    authLoading,
    user?.email,
    params?.mode,
  ]);
  const handleChange = (
    field:
      | "transactionName"
      | "propertyAddress"
      | "agreementnumber"
      | "notes",
    value: string
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };
  const handleNext = async () => {
    if (!formData.transactionName.trim()) {
      setErrorMessage(
        "Please enter transaction name."
      );
      return;
    }
    if (!formData.propertyAddress.trim()) {
      setErrorMessage(
        "Please enter property address."
      );
      return;
    }
    if (!formData.agreementnumber.trim()) {
      setErrorMessage(
        "Please enter agreement number."
      );
      return;
    }
    setErrorMessage("");
    setLoading(true);
    try {
      if (isEditMode) {
        const storedTransactionId =
          await AsyncStorage.getItem(
            CURRENT_TRANSACTION_KEY
          );
        const validExistingId =
          getValidTransactionId(
            storedTransactionId
          );
        if (!validExistingId) {
          throw new Error(
            "Transaction ID not found. Please return to Parties and try again."
          );
        }
        let resolvedUserId =
          transactionUserId;
        if (!resolvedUserId) {
          resolvedUserId =
            await resolveTransactionUser();
        }
        if (!resolvedUserId) {
          throw new Error(
            "Transaction user not found. Please login again."
          );
        }
        const response = await fetch(
          `${API_URL}/api/transactions/${encodeURIComponent(
            validExistingId
          )}`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              transactionName:
                formData.transactionName.trim(),
              propertyAddress:
                formData.propertyAddress.trim(),
              agreementnumber:
                formData.agreementnumber.trim(),
              notes:
                formData.notes.trim(),
              userId:
                resolvedUserId,
            }),
          }
        );
        let data: any;
        try {
          data = await response.json();
        } catch {
          throw new Error(
            "Invalid server response."
          );
        }
        console.log(
          "Update transaction response:",
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
              "Transaction update failed."
          );
        }
        await AsyncStorage.setItem(
          CURRENT_TRANSACTION_KEY,
          validExistingId
        );
        console.log(
          "Transaction updated successfully:",
          validExistingId
        );
        router.replace(
          "/(transactions)/parties" as any
        );
        return;
      }
      const storedTransactionId =
        await AsyncStorage.getItem(
          CURRENT_TRANSACTION_KEY
        );
      const validExistingId =
        getValidTransactionId(
          storedTransactionId
        );
      if (validExistingId) {
        await AsyncStorage.removeItem(
          CURRENT_TRANSACTION_KEY
        );
      }
      let resolvedUserId =
        transactionUserId;
      if (!resolvedUserId) {
        resolvedUserId =
          await resolveTransactionUser();
      }
      if (!resolvedUserId) {
        throw new Error(
          "Transaction user not found. Please login again."
        );
      }
      const response = await fetch(
        `${API_URL}/api/transactions/create`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            transactionName:
              formData.transactionName.trim(),
            propertyAddress:
              formData.propertyAddress.trim(),
            agreementnumber:
              formData.agreementnumber.trim(),
            notes:
              formData.notes.trim(),
            userId:
              resolvedUserId,
          }),
        }
      );
      let data: any;
      try {
        data = await response.json();
      } catch {
        throw new Error(
          "Invalid server response."
        );
      }
      console.log(
        "Create transaction response:",
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
            "Transaction creation failed."
        );
      }
      const returnedTransactionId =
        data?.transaction?._id ||
        data?.transaction?.id ||
        data?._id ||
        data?.id ||
        null;
      const savedTransactionId =
        getValidTransactionId(
          returnedTransactionId
        );
      if (!savedTransactionId) {
        throw new Error(
          "Transaction ID missing from server response."
        );
      }
      await AsyncStorage.setItem(
        CURRENT_TRANSACTION_KEY,
        savedTransactionId
      );
      setTransactionId(
        savedTransactionId
      );
      console.log(
        "New transaction created:",
        savedTransactionId
      );
      router.replace(
        "/(transactions)/parties" as any
      );
    } catch (error: any) {
      console.error(
        "Transaction Save Error:",
        error
      );
      if (
        error?.name === "AbortError"
      ) {
        setErrorMessage(
          "Request timed out. Please try again."
        );
      } else if (
        error?.name === "TypeError"
      ) {
        setErrorMessage(
          "Server down or network error."
        );
      } else {
        setErrorMessage(
          error?.message ||
            "Server error. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };
  if (
    authLoading ||
    loadingTransaction
  ) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator
          size="large"
          color="#8B6F47"
        />
        <Text className="mt-3 text-sm text-gray-500">
          {authLoading
            ? "Checking account..."
            : "Checking transaction..."}
        </Text>
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
          padding: 20,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6 flex-row items-center">
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-800">
              {isEditMode
                ? "Edit Transaction"
                : "Create Transaction"}
            </Text>
            <Text className="mt-1 text-sm text-gray-500">
              {isEditMode
                ? "Update the transaction information."
                : "Start a new real estate transaction."}
            </Text>
          </View>
        </View>
        {errorMessage ? (
          <View className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
            <Text className="text-sm leading-5 text-red-700">
              {errorMessage}
            </Text>
          </View>
        ) : null}
        <View className="rounded-2xl bg-white p-5 shadow-sm">
          <View className="mb-5">
            <View className="mb-2 flex-row items-center">
              <FileText
                size={17}
                color="#8B6F47"
              />
              <Text className="ml-2 text-sm font-semibold text-gray-700">
                Transaction Name *
              </Text>
            </View>
            <TextInput
              value={
                formData.transactionName
              }
              onChangeText={(value) =>
                handleChange(
                  "transactionName",
                  value
                )
              }
              placeholder="Example: 123 Main St Purchase"
              placeholderTextColor="#9CA3AF"
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-800"
              autoCapitalize="sentences"
            />
          </View>
          <View className="mb-5">
            <View className="mb-2 flex-row items-center">
              <MapPin
                size={17}
                color="#8B6F47"
              />
              <Text className="ml-2 text-sm font-semibold text-gray-700">
                Property Address *
              </Text>
            </View>
            <TextInput
              value={
                formData.propertyAddress
              }
              onChangeText={(value) =>
                handleChange(
                  "propertyAddress",
                  value
                )
              }
              placeholder="Enter property address"
              placeholderTextColor="#9CA3AF"
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-800"
              autoCapitalize="words"
            />
          </View>
          <View className="mb-5">
            <View className="mb-2 flex-row items-center">
              <Hash
                size={17}
                color="#8B6F47"
              />
              <Text className="ml-2 text-sm font-semibold text-gray-700">
                Agreement Number *
              </Text>
            </View>
            <TextInput
              value={
                formData.agreementnumber
              }
              onChangeText={(value) =>
                handleChange(
                  "agreementnumber",
                  value
                )
              }
              placeholder="Enter agreement number"
              placeholderTextColor="#9CA3AF"
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-800"
              autoCapitalize="characters"
            />
          </View>
          <View>
            <View className="mb-2 flex-row items-center">
              <NotebookPen
                size={17}
                color="#8B6F47"
              />
              <Text className="ml-2 text-sm font-semibold text-gray-700">
                Notes
              </Text>
            </View>
            <TextInput
              value={formData.notes}
              onChangeText={(value) =>
                handleChange(
                  "notes",
                  value
                )
              }
              placeholder="Optional notes about this transaction"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              className="min-h-[120px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-800"
            />
          </View>
        </View>
        <View className="mt-6 border-t border-gray-200 pt-5">
          <Pressable
            onPress={handleNext}
            disabled={loading}
            className={`flex-row items-center justify-center rounded-xl px-5 py-4 ${
              loading
                ? "bg-gray-400"
                : "bg-[#8B6F47]"
            }`}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color="#ffffff"
              />
            ) : (
              <Text className="text-base font-bold text-white">
                {isEditMode
                  ? "Save Changes & Return to Parties"
                  : "Next: Add Parties"}
              </Text>
            )}
          </Pressable>
          <Text className="mt-3 text-center text-xs text-gray-400">
            {isEditMode
              ? "Your changes will be saved before returning to Add Parties."
              : "Your transaction will be saved before continuing to Add Parties."}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}









































// import React, { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   KeyboardAvoidingView,
//   Platform,
//   Pressable,
//   ScrollView,
//   Text,
//   TextInput,
//   View,
// } from "react-native";
// import { useRouter } from "expo-router";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { ArrowLeft, FileText, MapPin, Hash, NotebookPen } from "lucide-react-native";
// import { useAuth } from "../../contexts/AuthContext";

// const API_URL = "https://realtorparth.ca";
// const CURRENT_TRANSACTION_KEY = "currentTransactionId";

// interface TransactionUser {
//   id?: string;
//   _id?: string;
//   userId?: string;
//   name?: string;
//   email?: string;
//   role?: string;
//   isSuperAdmin?: boolean;
// }

// interface Transaction {
//   _id?: string;
//   id?: string;
//   name: string;
//   propertyAddress: string;
//   agreementnumber: string;
//   notes?: string;
// }

// const getTransactionUserId = (
//   transactionUser: TransactionUser | null
// ): string | null => {
//   if (!transactionUser) {
//     return null;
//   }

//   if (
//     typeof transactionUser.id === "string" &&
//     transactionUser.id.trim()
//   ) {
//     return transactionUser.id;
//   }

//   if (
//     typeof transactionUser._id === "string" &&
//     transactionUser._id.trim()
//   ) {
//     return transactionUser._id;
//   }

//   if (
//     typeof transactionUser.userId === "string" &&
//     transactionUser.userId.trim()
//   ) {
//     return transactionUser.userId;
//   }

//   return null;
// };

// export default function CreateTransaction() {
//   const router = useRouter();
//   const { user, loading: authLoading } = useAuth();

//   const [transactionId, setTransactionId] = useState<string | null>(null);

//   const [transactionUserId, setTransactionUserId] = useState<string | null>(
//     null
//   );

//   const [formData, setFormData] = useState({
//     transactionName: "",
//     propertyAddress: "",
//     agreementnumber: "",
//     notes: "",
//   });

//   const [loading, setLoading] = useState(false);
//   const [loadingTransaction, setLoadingTransaction] = useState(true);
//   const [errorMessage, setErrorMessage] = useState("");

//   /*
//    * Resolve the Transaction user from the Admin user's email.
//    *
//    * IMPORTANT:
//    * We do NOT assume Admin user ID === Transaction user ID.
//    */
//   const resolveTransactionUser = async (): Promise<string | null> => {
//     if (!user?.email) {
//       throw new Error("Admin user not found. Please login again.");
//     }

//     const adminEmail = user.email.trim();

//     const controller = new AbortController();

//     const timeout = setTimeout(() => {
//       controller.abort();
//     }, 10000);

//     try {
//       const response = await fetch(
//         `${API_URL}/api/transactions/check-super-admin/${encodeURIComponent(
//           adminEmail
//         )}`,
//         {
//           method: "GET",
//           signal: controller.signal,
//         }
//       );

//       let data: any;

//       try {
//         data = await response.json();
//       } catch {
//         throw new Error("Invalid server response");
//       }

//       console.log("Transaction user response:", data);

//       if (!response.ok) {
//         throw new Error(
//           data?.message || `Error ${response.status}`
//         );
//       }

//       if (!data?.success) {
//         throw new Error(
//           data?.message || "Unable to verify transaction access"
//         );
//       }

//       if (!data?.isSuperAdmin) {
//         throw new Error(
//           "You do not have permission to access the Transaction Panel."
//         );
//       }

//       /*
//        * Support the possible response structures.
//        * Once you confirm your backend response, this can be simplified.
//        */
//       const transactionUser: TransactionUser | null =
//         data?.user ||
//         data?.transactionUser ||
//         data?.admin ||
//         data;

//       const id = getTransactionUserId(transactionUser);

//       if (!id) {
//         console.log("Unable to find transaction user ID:", data);

//         throw new Error(
//           "Transaction user ID was not returned by the server."
//         );
//       }

//       setTransactionUserId(id);

//       return id;
//     } finally {
//       clearTimeout(timeout);
//     }
//   };

//   /*
//    * LOAD EXISTING TRANSACTION
//    */
//   useEffect(() => {
//     if (authLoading) {
//       return;
//     }

//     if (!user?.email) {
//       setLoadingTransaction(false);
//       setErrorMessage("Admin user not found. Please login again.");
//       return;
//     }

//     const loadTransaction = async () => {
//       try {
//         setLoadingTransaction(true);
//         setErrorMessage("");

//         /*
//          * First resolve the correct Transaction user.
//          */
//         const resolvedUserId = await resolveTransactionUser();

//         if (!resolvedUserId) {
//           throw new Error("Transaction user not found.");
//         }

//         /*
//          * Get currently selected transaction.
//          */
//         const id = await AsyncStorage.getItem(
//           CURRENT_TRANSACTION_KEY
//         );

//         /*
//          * No current transaction means CREATE mode.
//          */
//         if (!id) {
//           setTransactionId(null);
//           return;
//         }

//         setTransactionId(id);

//         /*
//          * Load existing transaction.
//          */
//         const controller = new AbortController();

//         const timeout = setTimeout(() => {
//           controller.abort();
//         }, 10000);

//         try {
//           const response = await fetch(
//             `${API_URL}/api/transactions/${id}/${resolvedUserId}`,
//             {
//               method: "GET",
//               signal: controller.signal,
//             }
//           );

//           let data: any;

//           try {
//             data = await response.json();
//           } catch {
//             throw new Error("Invalid server response");
//           }

//           console.log("Transaction response:", data);

//           if (!response.ok) {
//             throw new Error(
//               data?.message || `Error ${response.status}`
//             );
//           }

//           if (!data?.success) {
//             throw new Error(
//               data?.message || "Failed to load transaction"
//             );
//           }

//           const transaction: Transaction = data.transaction;

//           if (!transaction) {
//             throw new Error("Transaction data not found.");
//           }

//           setFormData({
//             transactionName: transaction.name || "",
//             propertyAddress: transaction.propertyAddress || "",
//             agreementnumber: transaction.agreementnumber || "",
//             notes: transaction.notes || "",
//           });
//         } finally {
//           clearTimeout(timeout);
//         }
//       } catch (error: any) {
//         console.error("Load Transaction Error:", error);

//         if (error?.name === "AbortError") {
//           setErrorMessage("Request timed out.");
//         } else if (error?.name === "TypeError") {
//           setErrorMessage("Server down or network error.");
//         } else {
//           setErrorMessage(
//             error?.message || "Failed to load transaction."
//           );
//         }
//       } finally {
//         setLoadingTransaction(false);
//       }
//     };

//     loadTransaction();
//   }, [authLoading, user?.email]);

//   /*
//    * HANDLE INPUT
//    */
//   const handleChange = (
//     field:
//       | "transactionName"
//       | "propertyAddress"
//       | "agreementnumber"
//       | "notes",
//     value: string
//   ) => {
//     setFormData((previous) => ({
//       ...previous,
//       [field]: value,
//     }));
//   };

//   /*
//    * CREATE / UPDATE TRANSACTION
//    */
//   const handleNext = async () => {
//     if (!formData.transactionName.trim()) {
//       setErrorMessage("Please enter transaction name.");
//       return;
//     }

//     if (!formData.propertyAddress.trim()) {
//       setErrorMessage("Please enter property address.");
//       return;
//     }

//     if (!formData.agreementnumber.trim()) {
//       setErrorMessage("Please enter agreement number.");
//       return;
//     }

//     setErrorMessage("");
//     setLoading(true);

//     try {
//       /*
//        * Make sure we have the correct Transaction user ID.
//        */
//       let resolvedUserId = transactionUserId;

//       if (!resolvedUserId) {
//         resolvedUserId = await resolveTransactionUser();
//       }

//       if (!resolvedUserId) {
//         throw new Error(
//           "Transaction user not found. Please login again."
//         );
//       }

//       let url = `${API_URL}/api/transactions/create`;
//       let method = "POST";

//       /*
//        * UPDATE EXISTING TRANSACTION
//        */
//       if (transactionId) {
//         url = `${API_URL}/api/transactions/${transactionId}`;
//         method = "PUT";
//       }

//       const bodyData = {
//         transactionName: formData.transactionName.trim(),
//         propertyAddress: formData.propertyAddress.trim(),
//         agreementnumber: formData.agreementnumber.trim(),
//         notes: formData.notes.trim(),
//         userId: resolvedUserId,
//       };

//       console.log("Saving transaction:", {
//         url,
//         method,
//         bodyData,
//       });

//       const controller = new AbortController();

//       const timeout = setTimeout(() => {
//         controller.abort();
//       }, 10000);

//       try {
//         const response = await fetch(url, {
//           method,
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(bodyData),
//           signal: controller.signal,
//         });

//         let data: any;

//         try {
//           data = await response.json();
//         } catch {
//           throw new Error("Invalid server response");
//         }

//         console.log("Save transaction response:", data);

//         if (!response.ok) {
//           throw new Error(
//             data?.message || `Error ${response.status}`
//           );
//         }

//         if (!data?.success) {
//           throw new Error(
//             data?.message || "Transaction failed"
//           );
//         }

//         /*
//          * For create, get ID from response.
//          * For update, keep existing transaction ID.
//          */
//         const savedTransactionId =
//           transactionId ||
//           data?.transaction?._id ||
//           data?.transaction?.id;

//         if (!savedTransactionId) {
//           throw new Error("Transaction ID missing.");
//         }

//         /*
//          * Save current transaction.
//          */
//         await AsyncStorage.setItem(
//           CURRENT_TRANSACTION_KEY,
//           savedTransactionId
//         );

//         setTransactionId(savedTransactionId);

//         /*
//          * Go to Parties page.
//          */
//         router.push("/(transactions)/parties" as any);
//       } finally {
//         clearTimeout(timeout);
//       }
//     } catch (error: any) {
//       console.error("Create Transaction Error:", error);

//       if (error?.name === "AbortError") {
//         setErrorMessage("Request timed out.");
//       } else if (error?.name === "TypeError") {
//         setErrorMessage("Server down or network error.");
//       } else {
//         setErrorMessage(
//           error?.message || "Server error."
//         );
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   /*
//    * LOADING SCREEN
//    */
//   if (authLoading || loadingTransaction) {
//     return (
//       <View className="flex-1 items-center justify-center bg-gray-50">
//         <ActivityIndicator
//           size="large"
//           color="#8B6F47"
//         />

//         <Text className="mt-3 text-sm text-gray-500">
//           Loading transaction...
//         </Text>
//       </View>
//     );
//   }

//   return (
//     <KeyboardAvoidingView
//       className="flex-1 bg-gray-50"
//       behavior={Platform.OS === "ios" ? "padding" : undefined}
//     >
//       <ScrollView
//         className="flex-1"
//         contentContainerStyle={{
//           padding: 20,
//           paddingBottom: 40,
//         }}
//         keyboardShouldPersistTaps="handled"
//         showsVerticalScrollIndicator={false}
//       >
//         {/* HEADER */}
//         <View className="mb-6 flex-row items-center">
//           {/* <Pressable
//             onPress={() => router.back()}
//             className="mr-3 rounded-xl bg-white p-3"
//           >
//             <ArrowLeft
//               size={21}
//               color="#374151"
//             />
//           </Pressable> */}

//           <View className="flex-1">
//             <Text className="text-xl font-bold text-gray-800">
//               {transactionId
//                 ? "Edit Transaction"
//                 : "Create Transaction"}
//             </Text>

//             <Text className="mt-1 text-sm text-gray-500">
//               Start or edit a real estate transaction.
//             </Text>
//           </View>
//         </View>

//         {/* ERROR */}
//         {errorMessage ? (
//           <View className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
//             <Text className="text-sm leading-5 text-red-700">
//               {errorMessage}
//             </Text>
//           </View>
//         ) : null}

//         {/* FORM CARD */}
//         <View className="rounded-2xl bg-white p-5 shadow-sm">
//           {/* TRANSACTION NAME */}
//           <View className="mb-5">
//             <View className="mb-2 flex-row items-center">
//               <FileText
//                 size={17}
//                 color="#8B6F47"
//               />

//               <Text className="ml-2 text-sm font-semibold text-gray-700">
//                 Transaction Name *
//               </Text>
//             </View>

//             <TextInput
//               value={formData.transactionName}
//               onChangeText={(value) =>
//                 handleChange("transactionName", value)
//               }
//               placeholder="Example: 123 Main St Purchase"
//               placeholderTextColor="#9CA3AF"
//               className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-800"
//               autoCapitalize="sentences"
//             />
//           </View>

//           {/* PROPERTY ADDRESS */}
//           <View className="mb-5">
//             <View className="mb-2 flex-row items-center">
//               <MapPin
//                 size={17}
//                 color="#8B6F47"
//               />

//               <Text className="ml-2 text-sm font-semibold text-gray-700">
//                 Property Address *
//               </Text>
//             </View>

//             <TextInput
//               value={formData.propertyAddress}
//               onChangeText={(value) =>
//                 handleChange("propertyAddress", value)
//               }
//               placeholder="Enter property address"
//               placeholderTextColor="#9CA3AF"
//               className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-800"
//               autoCapitalize="words"
//             />
//           </View>

//           {/* AGREEMENT NUMBER */}
//           <View className="mb-5">
//             <View className="mb-2 flex-row items-center">
//               <Hash
//                 size={17}
//                 color="#8B6F47"
//               />

//               <Text className="ml-2 text-sm font-semibold text-gray-700">
//                 Agreement Number *
//               </Text>
//             </View>

//             <TextInput
//               value={formData.agreementnumber}
//               onChangeText={(value) =>
//                 handleChange("agreementnumber", value)
//               }
//               placeholder="Enter agreement number"
//               placeholderTextColor="#9CA3AF"
//               className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-800"
//               autoCapitalize="characters"
//             />
//           </View>

//           {/* NOTES */}
//           <View>
//             <View className="mb-2 flex-row items-center">
//               <NotebookPen
//                 size={17}
//                 color="#8B6F47"
//               />

//               <Text className="ml-2 text-sm font-semibold text-gray-700">
//                 Notes
//               </Text>
//             </View>

//             <TextInput
//               value={formData.notes}
//               onChangeText={(value) =>
//                 handleChange("notes", value)
//               }
//               placeholder="Optional notes about this transaction"
//               placeholderTextColor="#9CA3AF"
//               multiline
//               numberOfLines={5}
//               textAlignVertical="top"
//               className="min-h-[120px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-800"
//             />
//           </View>
//         </View>

//         {/* FOOTER BUTTON */}
//         <View className="mt-6 border-t border-gray-200 pt-5">
//           <Pressable
//             onPress={handleNext}
//             disabled={loading}
//             className={`flex-row items-center justify-center rounded-xl px-5 py-4 ${
//               loading
//                 ? "bg-gray-400"
//                 : "bg-[#8B6F47]"
//             }`}
//           >
//             {loading ? (
//               <ActivityIndicator
//                 size="small"
//                 color="#ffffff"
//               />
//             ) : (
//               <Text className="text-base font-bold text-white">
//                 Next: Add Parties
//               </Text>
//             )}
//           </Pressable>
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// }