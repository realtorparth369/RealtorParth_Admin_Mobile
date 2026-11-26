// app/(transactions)/_layout.tsx

import React from "react";
import { Stack } from "expo-router";

export default function TransactionLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,

                headerStyle: {
                    backgroundColor: "#ffffff",
                },

                headerTintColor: "#1f2937",

                headerTitleStyle: {
                    fontWeight: "700",
                    fontSize: 17,
                },

                contentStyle: {
                    backgroundColor: "#f9fafb",
                },
            }}
        >
            {/* =================================================
                TRANSACTION PANEL
            ================================================= */}
            <Stack.Screen
                name="index"
                options={{
                    title: "Realtor Parth Transaction Panel",
                }}
            />

            {/* =================================================
                TRANSACTION LOGIN
                Used only when entering Transaction Portal
                independently.
            ================================================= */}
            <Stack.Screen
                name="login"
                options={{
                    title: "Transaction Login",
                    headerShown: false,
                }}
            />

            {/* =================================================
                TRANSACTION SIGNUP
            ================================================= */}
            <Stack.Screen
                name="signup"
                options={{
                    title: "Transaction Signup",
                    headerShown: false,
                }}
            />

            {/* =================================================
                ARCHIVED TRANSACTIONS
            ================================================= */}
            <Stack.Screen
                name="archived"
                options={{
                    title: "Archived Transactions",
                }}
            />

            {/* =================================================
                CREATE / EDIT TRANSACTION
            ================================================= */}
            <Stack.Screen
                name="new-transaction"
                options={{
                    title: "Transaction",
                }}
            />

            {/* =================================================
                PARTIES
            ================================================= */}
            <Stack.Screen
                name="parties"
                options={{
                    title: "Parties",
                }}
            />

            {/* =================================================
                PARTY DOCUMENTS
            ================================================= */}
            <Stack.Screen
                name="partypdfdata/[id]"
                options={{
                    title: "Party Documents",
                }}
            />

            {/* =================================================
                FINTRAC
            ================================================= */}
            <Stack.Screen
                name="party/fintrac/[id]"
                options={{
                    title: "FINTRAC",
                }}
            />

            {/* =================================================
                POLITICALLY EXPOSED PERSON
            ================================================= */}
            <Stack.Screen
                name="party/politically-exposed/[id]"
                options={{
                    title: "Politically Exposed Person/Head of Internation Organization",
                }}
            />

            {/* =================================================
                CONSUMER RELATIONSHIP GUIDE
            ================================================= */}
            <Stack.Screen
                name="party/crg/[id]"
                options={{
                    title: "Consumer Relationship Guide",
                }}
            />


            {/* =================================================
                PARTY FORMS
            ================================================= */}

            <Stack.Screen
                name="party/forms/EBRADA/[id]"
                options={{
                    title: "Exclusive Buyer Representation Agreement (Designated Agency)",
                }}
            />

            <Stack.Screen
                name="party/forms/EBRAA/[id]"
                options={{
                    title: "Exclusive Buyer Representation Agreement Amendment",
                }}
            />

            <Stack.Screen
                name="party/forms/EBRATDA/[id]"
                options={{
                    title: "Exclusive Buyer Representation Agreement Termination (Designated Agency)",
                }}
            />

            <Stack.Screen
                name="party/forms/RPC/[id]"
                options={{
                    title: "Residential Purchase Contract",
                }}
            />


            <Stack.Screen
                name="party/forms/SCSAAFA/[id]"
                options={{
                    title: "Seller Customer Acknowledgement and Fee Agreement",
                }}
            />

            <Stack.Screen
                name="party/forms/IDMMGOL/[id]"
                options={{
                    title: "Illegal Drug Manufacture / Marijuana Grow Operation",
                }}
            />

            <Stack.Screen
                name="party/forms/ESRAA/[id]"
                options={{
                    title: "Exclusive Seller Representation Agreement Amendment",
                }}
            />



            {/* =================================================
                ACCOUNT SETTINGS
            ================================================= */}
            <Stack.Screen
                name="account"
                options={{
                    title: "Account Settings",
                }}
            />
        </Stack>
    );
}