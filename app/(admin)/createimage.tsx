import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";

import { captureRef } from "react-native-view-shot";

import { Ionicons } from "@expo/vector-icons";

import axios from "axios";

import { useAuth } from "../../contexts/AuthContext";

/* =========================================================
   TYPES
========================================================= */

type DesignType =
  | "social-portrait"
  | "social-landscape"
  | "blog-portrait"
  | "blog-landscape"
  | "social-portrait2"
  | "social-landscape2";

interface SelectedImage {
  uri: string;
  name: string;
  type: string;
}

interface Design {
  id: DesignType;
  title: string;
  size: string;
  description: string;
  preview: any;
}

interface Branding {
  agentName?: string;
  phone?: string;
  agentImage?: string;
  brokerageLogo?: string;
  goldenBrokerageLogo?: string;
}

interface ImageDimensions {
  width: number;
  height: number;
}

/* =========================================================
   CONFIG
========================================================= */

const API_URL = "https://realtorparth.ca";

/* =========================================================
   DESIGNS
========================================================= */

const designs: Design[] = [
  {
    id: "social-portrait",
    title: "White & Black Portrait",
    size: "1080 × 1350",
    description: "Professional Realtor Marketing Template",
    preview: require("../../assets/images/social-portrait.jpg"),
  },

  {
    id: "social-landscape",
    title: "White & Black Landscape",
    size: "1200 × 800",
    description: "Professional Realtor Marketing Template",
    preview: require("../../assets/images/social-landscape.jpg"),
  },

  {
    id: "blog-portrait",
    title: "Golden & Black Portrait",
    size: "1080 × 1350",
    description: "Professional Realtor Marketing Template",
    preview: require("../../assets/images/blog-portrait.jpg"),
  },

  {
    id: "blog-landscape",
    title: "Golden & Black Landscape",
    size: "1200 × 800",
    description: "Professional Realtor Marketing Template",
    preview: require("../../assets/images/blog-landscape.jpg"),
  },

  {
    id: "social-portrait2",
    title: "Premium White & Brown Portrait",
    size: "1080 × 1350",
    description: "Premium Realtor Marketing Template",
    preview: require("../../assets/images/social-portrait2.jpg"),
  },

  {
    id: "social-landscape2",
    title: "Premium White & Brown Landscape",
    size: "1200 × 800",
    description: "Premium Realtor Marketing Template",
    preview: require("../../assets/images/blog-landscape2.jpg"),
  },
];

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  title,
  description,
  badge,
}: {
  title: string;
  description?: string;
  badge?: string;
}) {
  return (
    <View className="mb-5">
      <View className="flex-row items-center justify-between">
        <View className="mr-3 flex-1">
          <Text className="text-xl font-bold text-slate-900">
            {title}
          </Text>

          {description ? (
            <Text className="mt-1 text-sm leading-5 text-slate-500">
              {description}
            </Text>
          ) : null}
        </View>

        {badge ? (
          <View className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
            <Text className="text-xs font-semibold text-blue-700">
              {badge}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/* =========================================================
   DESIGN SIZE
========================================================= */

function getDesignSize(design: DesignType) {
  switch (design) {
    case "social-portrait":
    case "blog-portrait":
    case "social-portrait2":
      return {
        width: 1080,
        height: 1350,
      };

    case "social-landscape":
    case "blog-landscape":
    case "social-landscape2":
      return {
        width: 1200,
        height: 800,
      };

    default:
      return {
        width: 1080,
        height: 1350,
      };
  }
}

/* =========================================================
   WEBSITE drawImageCover EQUIVALENT
========================================================= */

function getCoverStyle(
  imageWidth: number,
  imageHeight: number,
  targetWidth: number,
  targetHeight: number
) {
  if (!imageWidth || !imageHeight) {
    return {
      width: targetWidth,
      height: targetHeight,
      left: 0,
      top: 0,
    };
  }

  const scale = Math.max(
    targetWidth / imageWidth,
    targetHeight / imageHeight
  );

  const width = imageWidth * scale;
  const height = imageHeight * scale;

  return {
    width,
    height,
    left: (targetWidth - width) / 2,
    top: (targetHeight - height) / 2,
  };
}

/* =========================================================
   DESIGN CANVAS
========================================================= */

interface DesignCanvasProps {
  design: DesignType;
  propertyImage: string;
  agentImage: string;
  logo: string;
  agentName: string;
  phone: string;

  /*
   * IMPORTANT:
   *
   * React Native version used by this project expects
   * RefObject<View>, not RefObject<View | null>.
   */
  canvasRef: React.RefObject<View>;

  onReady: () => void;
}

function DesignCanvas({
  design,
  propertyImage,
  agentImage,
  logo,
  agentName,
  phone,
  canvasRef,
  onReady,
}: DesignCanvasProps) {
  const [propertyLoaded, setPropertyLoaded] =
    useState(false);

  const [agentLoaded, setAgentLoaded] =
    useState(false);

  const [logoLoaded, setLogoLoaded] =
    useState(false);

  const [
    propertyDimensions,
    setPropertyDimensions,
  ] = useState<ImageDimensions>({
    width: 0,
    height: 0,
  });

  const [
    agentDimensions,
    setAgentDimensions,
  ] = useState<ImageDimensions>({
    width: 0,
    height: 0,
  });

  const size = getDesignSize(design);

  const displayName = (
    agentName || "PARTH BRAHMBHATT"
  ).toUpperCase();

  const displayPhone =
    phone || "403-439-1555";

  const ready =
    propertyLoaded &&
    agentLoaded &&
    logoLoaded &&
    propertyDimensions.width > 0 &&
    propertyDimensions.height > 0 &&
    agentDimensions.width > 0 &&
    agentDimensions.height > 0;

  /* =======================================================
     READY CALLBACK
  ======================================================= */

  useEffect(() => {
    if (!ready) {
      return;
    }

    const timer = setTimeout(() => {
      onReady();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [ready, onReady]);

  /* =======================================================
     PROPERTY COVER
  ======================================================= */

  const propertyCover = getCoverStyle(
    propertyDimensions.width,
    propertyDimensions.height,
    size.width,
    size.height
  );

  /* =======================================================
     AGENT DIMENSIONS
  ======================================================= */

  const portraitAgentHeight = 900;

  const portraitAgentWidth =
    agentDimensions.width &&
      agentDimensions.height
      ? (agentDimensions.width /
        agentDimensions.height) *
      portraitAgentHeight
      : 0;

  const premiumPortraitAgentHeight = 580;

  const premiumPortraitAgentWidth =
    agentDimensions.width &&
      agentDimensions.height
      ? (agentDimensions.width /
        agentDimensions.height) *
      premiumPortraitAgentHeight
      : 0;

  /* =======================================================
     CANVAS
  ======================================================= */

  return (
    <View
      ref={canvasRef}
      collapsable={false}
      pointerEvents="none"
      style={{
        position: "absolute",
        width: size.width,
        height: size.height,
        left: -10000,
        top: 0,
        backgroundColor: "#ffffff",
        overflow: "hidden",
      }}
    >
      {/* =================================================
          PROPERTY BACKGROUND
      ================================================= */}

      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: size.width,
          height: size.height,
          overflow: "hidden",
        }}
      >
        <Image
          source={{
            uri: propertyImage,
          }}
          onLoad={(event) => {
            const source =
              event.nativeEvent.source;

            setPropertyDimensions({
              width: source.width,
              height: source.height,
            });

            setPropertyLoaded(true);
          }}
          onError={() => {
            console.error(
              "PROPERTY IMAGE LOAD ERROR:",
              propertyImage
            );
          }}
          style={{
            position: "absolute",
            width: propertyCover.width,
            height: propertyCover.height,
            left: propertyCover.left,
            top: propertyCover.top,
          }}
          resizeMode="stretch"
        />
      </View>

      {/* =================================================
          SOCIAL PORTRAIT
      ================================================= */}

      {design === "social-portrait" && (
        <>
          {/* REALTOR IMAGE */}

          <Image
            source={{
              uri: agentImage,
            }}
            onLoad={(event) => {
              const source =
                event.nativeEvent.source;

              setAgentDimensions({
                width: source.width,
                height: source.height,
              });

              setAgentLoaded(true);
            }}
            onError={() => {
              console.error(
                "AGENT IMAGE LOAD ERROR:",
                agentImage
              );
            }}
            style={{
              position: "absolute",
              width: portraitAgentWidth,
              height: portraitAgentHeight,
              left:
                1080 -
                portraitAgentWidth +
                120,
              top: 600,
            }}
            resizeMode="stretch"
          />

          {/* LEFT WHITE FOOTER */}

          <View
            style={{
              position: "absolute",
              left: 0,
              top: 1150,
              width: 360,
              height: 200,
              backgroundColor: "#ffffff",
            }}
          >
            <Image
              source={{
                uri: logo,
              }}
              onLoad={() =>
                setLogoLoaded(true)
              }
              onError={() => {
                console.error(
                  "LOGO LOAD ERROR:",
                  logo
                );
              }}
              style={{
                position: "absolute",
                left: 0,
                top: 5,
                width: 360,
                height: 190,
              }}
              resizeMode="contain"
            />
          </View>

          {/* RIGHT BLACK FOOTER */}

          <View
            style={{
              position: "absolute",
              left: 360,
              top: 1150,
              width: 720,
              height: 200,
              backgroundColor: "#111111",
            }}
          >
            {/* DIVIDER */}

            <View
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 2,
                height: 200,
                backgroundColor: "#2b2b2b",
              }}
            />

            {/* PHONE */}

            <Text
              style={{
                position: "absolute",
                left: 0,
                top: 25,
                width: 720,
                textAlign: "center",
                color: "#ffffff",
                fontSize: 44,
                fontWeight: "700",
              }}
            >
              {displayPhone}
            </Text>

            {/* NAME */}

            <Text
              style={{
                position: "absolute",
                left: 0,
                top: 80,
                width: 720,
                textAlign: "center",
                color: "#ffffff",
                fontSize: 48,
                fontWeight: "800",
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {displayName}
            </Text>

            {/* REALTOR */}

            <Text
              style={{
                position: "absolute",
                left: 0,
                top: 155,
                width: 720,
                textAlign: "center",
                color: "#d4d4d4",
                fontSize: 24,
                fontWeight: "500",
              }}
            >
              REALTOR
            </Text>
          </View>
        </>
      )}

      {/* =================================================
          SOCIAL LANDSCAPE
      ================================================= */}

      {design === "social-landscape" && (
        <>
          {/* REALTOR */}

          <Image
            source={{
              uri: agentImage,
            }}
            onLoad={(event) => {
              const source =
                event.nativeEvent.source;

              setAgentDimensions({
                width: source.width,
                height: source.height,
              });

              setAgentLoaded(true);
            }}
            onError={() => {
              console.error(
                "AGENT IMAGE LOAD ERROR:",
                agentImage
              );
            }}
            style={{
              position: "absolute",
              left: 730,
              top: 200,
              width: 540,
              height: 720,
            }}
            resizeMode="stretch"
          />

          {/* WHITE AREA */}

          <View
            style={{
              position: "absolute",
              left: 0,
              top: 650,
              width: 320,
              height: 150,
              backgroundColor: "#ffffff",
            }}
          >
            <Image
              source={{
                uri: logo,
              }}
              onLoad={() =>
                setLogoLoaded(true)
              }
              onError={() => {
                console.error(
                  "LOGO LOAD ERROR:",
                  logo
                );
              }}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 320,
                height: 150,
              }}
              resizeMode="contain"
            />
          </View>

          {/* BLACK AREA */}

          <View
            style={{
              position: "absolute",
              left: 320,
              top: 650,
              width: 880,
              height: 150,
              backgroundColor: "#111111",
            }}
          >
            {/* DIVIDER */}

            <View
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 2,
                height: 150,
                backgroundColor: "#2b2b2b",
              }}
            />

            {/* PHONE */}

            <Text
              style={{
                position: "absolute",
                left: 0,
                top: 18,
                width: 880,
                textAlign: "center",
                color: "#ffffff",
                fontSize: 30,
                fontWeight: "700",
              }}
            >
              {displayPhone}
            </Text>

            {/* NAME */}

            <Text
              style={{
                position: "absolute",
                left: 0,
                top: 55,
                width: 880,
                textAlign: "center",
                color: "#ffffff",
                fontSize: 38,
                fontWeight: "800",
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {displayName}
            </Text>

            {/* REALTOR */}

            <Text
              style={{
                position: "absolute",
                left: 0,
                top: 105,
                width: 880,
                textAlign: "center",
                color: "#ffffff",
                fontSize: 22,
                fontWeight: "600",
              }}
            >
              REALTOR
            </Text>
          </View>
        </>
      )}

      {/* =================================================
          BLOG LANDSCAPE
      ================================================= */}

      {design === "blog-landscape" && (
        <>
          {/* REALTOR */}

          <Image
            source={{
              uri: agentImage,
            }}
            onLoad={(event) => {
              const source = event.nativeEvent.source;

              setAgentDimensions({
                width: source.width,
                height: source.height,
              });

              setAgentLoaded(true);
            }}
            onError={() => {
              console.error(
                "AGENT IMAGE LOAD ERROR:",
                agentImage
              );
            }}
            style={{
              position: "absolute",
              left: 730,
              top: 200,
              width: 540,
              height: 720,
            }}
            resizeMode="stretch"
          />

          {/* WHITE AREA */}

          <View
            style={{
              position: "absolute",
              left: 0,
              top: 650,
              width: 320,
              height: 150,
              backgroundColor: "#ffffff",
              overflow: "hidden",
            }}
          >
            <Image
              source={{
                uri: logo,
              }}
              onLoad={() => setLogoLoaded(true)}
              onError={() => {
                console.error(
                  "LOGO LOAD ERROR:",
                  logo
                );
              }}
              style={{
                position: "absolute",
                left: -45,
                top: -8,
                width: 410,
                height: 166,
              }}
              resizeMode="contain"
            />
          </View>

          {/* BLACK AREA */}

          <View
            style={{
              position: "absolute",
              left: 320,
              top: 650,
              width: 880,
              height: 150,
              backgroundColor: "#111111",
            }}
          >
            {/* DIVIDER */}

            <View
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 2,
                height: 150,
                backgroundColor: "#2b2b2b",
              }}
            />

            {/* PHONE */}

            <Text
              style={{
                position: "absolute",
                left: 0,
                top: 18,
                width: 880,
                textAlign: "center",
                color: "#d6a72b",
                fontSize: 30,
                fontWeight: "700",
              }}
            >
              {displayPhone}
            </Text>

            {/* NAME */}

            <Text
              style={{
                position: "absolute",
                left: 0,
                top: 55,
                width: 880,
                textAlign: "center",
                color: "#d6a72b",
                fontSize: 38,
                fontWeight: "800",
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {displayName}
            </Text>

            {/* REALTOR */}

            <Text
              style={{
                position: "absolute",
                left: 0,
                top: 105,
                width: 880,
                textAlign: "center",
                color: "#d6a72b",
                fontSize: 22,
                fontWeight: "600",
              }}
            >
              REALTOR
            </Text>
          </View>
        </>
      )}

      {/* =================================================
          BLOG PORTRAIT
      ================================================= */}

      {design === "blog-portrait" && (
        <>
          {/* REALTOR */}

          <Image
            source={{
              uri: agentImage,
            }}
            onLoad={(event) => {
              const source = event.nativeEvent.source;

              setAgentDimensions({
                width: source.width,
                height: source.height,
              });

              setAgentLoaded(true);
            }}
            onError={() => {
              console.error(
                "AGENT IMAGE LOAD ERROR:",
                agentImage
              );
            }}
            style={{
              position: "absolute",
              width: portraitAgentWidth,
              height: portraitAgentHeight,
              left:
                1080 -
                portraitAgentWidth +
                120,
              top: 520,
            }}
            resizeMode="stretch"
          />

          {/* WHITE AREA */}

          <View
            style={{
              position: "absolute",
              left: 0,
              top: 1150,
              width: 360,
              height: 200,
              backgroundColor: "#ffffff",
              overflow: "hidden",
            }}
          >
            <Image
              source={{
                uri: logo,
              }}
              onLoad={() => setLogoLoaded(true)}
              onError={() => {
                console.error(
                  "LOGO LOAD ERROR:",
                  logo
                );
              }}
              style={{
                position: "absolute",
                left: -45,
                top: -10,
                width: 450,
                height: 220,
              }}
              resizeMode="contain"
            />
          </View>

          {/* BLACK AREA */}

          <View
            style={{
              position: "absolute",
              left: 360,
              top: 1150,
              width: 720,
              height: 200,
              backgroundColor: "#111111",
            }}
          >
            {/* DIVIDER */}

            <View
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 2,
                height: 200,
                backgroundColor: "#2b2b2b",
              }}
            />

            {/* PHONE */}

            <Text
              style={{
                position: "absolute",
                left: 20,
                top: 28,
                width: 680,
                textAlign: "center",
                color: "#d6a72b",
                fontSize: 40,
                fontWeight: "700",
                lineHeight: 46,
              }}
            >
              {displayPhone}
            </Text>

            {/* NAME */}

            <Text
              style={{
                position: "absolute",
                left: 20,
                top: 82,
                width: 680,
                textAlign: "center",
                color: "#d6a72b",
                fontSize: 44,
                fontWeight: "800",
                lineHeight: 52,
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {displayName}
            </Text>

            {/* REALTOR */}

            <Text
              style={{
                position: "absolute",
                left: 20,
                top: 143,
                width: 680,
                textAlign: "center",
                color: "#d6a72b",
                fontSize: 22,
                fontWeight: "500",
                lineHeight: 27,
                letterSpacing: 1.5,
              }}
            >
              REALTOR
            </Text>
          </View>
        </>
      )}

      {/* =================================================
          PREMIUM PORTRAIT 2
      ================================================= */}

      {design === "social-portrait2" && (
        <>
          {/* BACKGROUND IS ALREADY DRAWN */}

          {/* WHITE FOOTER */}

          <View
            style={{
              position: "absolute",
              left: 0,
              top: 1160,
              width: 280,
              height: 190,
              backgroundColor: "#ffffff",
              overflow: "hidden",
            }}
          >
            <Image
              source={{
                uri: logo,
              }}
              onLoad={() =>
                setLogoLoaded(true)
              }
              onError={() => {
                console.error(
                  "LOGO LOAD ERROR:",
                  logo
                );
              }}
              style={{
                position: "absolute",
                left: -10,
                top: 0,
                width: 300,
                height: 190,
              }}
              resizeMode="contain"
            />
          </View>

          {/* BROWN FOOTER */}

          <View
            style={{
              position: "absolute",
              left: 280,
              top: 1160,
              width: 800,
              height: 190,
              backgroundColor: "#4b2b2b",
            }}
          >
            {/* NAME */}

            <Text
              style={{
                position: "absolute",
                left: 35,
                top: 30,
                color: "#ffffff",
                fontSize: 38,
                fontWeight: "800",
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {displayName.toUpperCase()}
            </Text>

            {/* ROLE */}

            <Text
              style={{
                position: "absolute",
                left: 170,
                top: 83,
                color: "#ffffff",
                fontSize: 30,
                fontWeight: "400",
              }}
            >
              Realtor
            </Text>

            {/* PHONE */}

            <Text
              style={{
                position: "absolute",
                left: 80,
                top: 120,
                color: "#ffffff",
                fontSize: 38,
                fontWeight: "500",
              }}
            >
              {displayPhone}
            </Text>
          </View>

          {/* REALTOR IMAGE */}

          <Image
            source={{
              uri: agentImage,
            }}
            onLoad={(event) => {
              const source =
                event.nativeEvent.source;

              setAgentDimensions({
                width: source.width,
                height: source.height,
              });

              setAgentLoaded(true);
            }}
            onError={() => {
              console.error(
                "AGENT IMAGE LOAD ERROR:",
                agentImage
              );
            }}
            style={{
              position: "absolute",
              left: 760,
              top: 914,
              width: 450,
              height:
                premiumPortraitAgentHeight,
            }}
            resizeMode="stretch"
          />
        </>
      )}
      {/* // style={{
      //   position: "absolute",
      //   left: 650,
      //   top:
      //     size.height -
      //     premiumPortraitAgentHeight,
      //   width:
      //     premiumPortraitAgentWidth,
      //   height:
      //     premiumPortraitAgentHeight,
      // }} */}

      {/* =================================================
          PREMIUM LANDSCAPE 2
      ================================================= */}

      {design === "social-landscape2" && (
        <>
          {/* WHITE LOGO AREA */}

          <View
            style={{
              position: "absolute",
              left: 0,
              top: 650,
              width: 300,
              height: 150,
              backgroundColor: "#ffffff",
              overflow: "hidden",
            }}
          >
            <Image
              source={{
                uri: logo,
              }}
              onLoad={() =>
                setLogoLoaded(true)
              }
              onError={() => {
                console.error(
                  "LOGO LOAD ERROR:",
                  logo
                );
              }}
              style={{
                position: "absolute",
                left: -10,
                top: 0,
                width: 320,
                height: 150,
              }}
              resizeMode="contain"
            />
          </View>

          {/* BROWN AREA */}

          <View
            style={{
              position: "absolute",
              left: 300,
              top: 650,
              width: 900,
              height: 150,
              backgroundColor: "#4b2b2b",
            }}
          >
            {/* NAME */}

            <Text
              style={{
                position: "absolute",
                left: -80,
                top: 11,
                width: 900,
                textAlign: "center",
                color: "#ffffff",
                fontSize: 34,
                fontWeight: "800",
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {displayName.toUpperCase()}
            </Text>

            {/* REALTOR */}

            <Text
              style={{
                position: "absolute",
                left: -80,
                top: 51,
                width: 900,
                textAlign: "center",
                color: "#ffffff",
                fontSize: 30,
                fontWeight: "400",
              }}
            >
              Realtor
            </Text>

            {/* PHONE */}

            <Text
              style={{
                position: "absolute",
                left: -80,
                top: 93,
                width: 900,
                textAlign: "center",
                color: "#ffffff",
                fontSize: 36,
                fontWeight: "500",
              }}
            >
              {displayPhone}
            </Text>
          </View>

          {/* REALTOR IMAGE */}

          <Image
            source={{
              uri: agentImage,
            }}
            onLoad={(event) => {
              const source =
                event.nativeEvent.source;

              setAgentDimensions({
                width: source.width,
                height: source.height,
              });

              setAgentLoaded(true);
            }}
            onError={() => {
              console.error(
                "AGENT IMAGE LOAD ERROR:",
                agentImage
              );
            }}
            style={{
              position: "absolute",
              left: 900,
              top: 390,
              width: 418,
              height: 560,
            }}
            resizeMode="stretch"
          />
        </>
      )}

      {/* =================================================
          LOADING COVER
      ================================================= */}

      {!ready && (
        <View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: size.width,
            height: size.height,
            backgroundColor: "#ffffff",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator
            size="large"
            color="#2563EB"
          />

          <Text
            style={{
              marginTop: 20,
              color: "#64748B",
              fontSize: 28,
              fontWeight: "600",
            }}
          >
            Preparing design...
          </Text>
        </View>
      )}
    </View>
  );
}

/* =========================================================
   MAIN SCREEN
========================================================= */

export default function CreateImageScreen() {
  const { user } = useAuth();

  /* =======================================================
     FILES
  ======================================================= */

  const [
    files,
    setFiles,
  ] = useState<SelectedImage[]>([]);

  /* =======================================================
     DESIGN
  ======================================================= */

  const [
    design,
    setDesign,
  ] = useState<DesignType>(
    "social-portrait"
  );

  /* =======================================================
     BRANDING
  ======================================================= */

  const [
    agentName,
    setAgentName,
  ] = useState("");

  const [
    agentPhone,
    setAgentPhone,
  ] = useState("");

  const [
    savedAgentImage,
    setSavedAgentImage,
  ] = useState("");

  const [
    savedBrokerLogo,
    setSavedBrokerLogo,
  ] = useState("");

  const [
    savedGoldenBrokerLogo,
    setSavedGoldenBrokerLogo,
  ] = useState("");

  /* =======================================================
     BRAND MODAL
  ======================================================= */

  const [
    showBrandModal,
    setShowBrandModal,
  ] = useState(false);

  const [
    savingBranding,
    setSavingBranding,
  ] = useState(false);

  /* =======================================================
     GENERATION
  ======================================================= */

  const [
    generating,
    setGenerating,
  ] = useState(false);

  const [
    generatedImages,
    setGeneratedImages,
  ] = useState<string[]>([]);

  const [
    generationResults,
    setGenerationResults,
  ] = useState<string[]>([]);

  const [
    generationIndex,
    setGenerationIndex,
  ] = useState<number | null>(null);

  const [
    generationDone,
    setGenerationDone,
  ] = useState(false);

  /* =======================================================
     REF
  ======================================================= */

  /*
   * IMPORTANT TYPESCRIPT FIX
   *
   * Do NOT use:
   *
   * useRef<View>(null)
   *
   * with this project's React Native typings.
   *
   * null! gives the RefObject<View> type expected
   * by the View ref prop.
   */

  const canvasRef =
    useRef<View>(null!);

  /*
   * Keeps the latest generation result list available
   * inside the generation effect.
   */

  const generationResultsRef =
    useRef<string[]>([]);

  useEffect(() => {
    generationResultsRef.current =
      generationResults;
  }, [generationResults]);

  /* =======================================================
     LOAD BRANDING
  ======================================================= */

  const loadBranding =
    useCallback(async () => {
      try {
        const adminEmail =
          user?.email;

        if (!adminEmail) {
          return;
        }

        console.log(
          "Loading branding for:",
          adminEmail
        );

        const response =
          await axios.get(
            `${API_URL}/api/design-branding/${encodeURIComponent(
              adminEmail
            )}`
          );

        const branding:
          Branding =
          response.data?.branding;

        if (!branding) {
          return;
        }

        setAgentName(
          branding.agentName || ""
        );

        setAgentPhone(
          branding.phone || ""
        );

        setSavedAgentImage(
          branding.agentImage || ""
        );

        setSavedBrokerLogo(
          branding.brokerageLogo || ""
        );

        setSavedGoldenBrokerLogo(
          branding.goldenBrokerageLogo || ""
        );

        console.log(
          "Branding loaded successfully."
        );
      } catch (error) {
        console.error(
          "BRANDING LOAD ERROR:",
          error
        );
      }
    }, [user?.email]);

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  /* =======================================================
     PICK PROPERTY IMAGES
  ======================================================= */

  const pickImages =
    async () => {
      try {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Permission Required",
            "Please allow photo library access to upload property images."
          );

          return;
        }

        const result =
          await ImagePicker.launchImageLibraryAsync({
            /*
             * IMPORTANT:
             *
             * Do NOT use:
             *
             * mediaTypes: ["images"]
             *
             * with the Expo version currently installed.
             */

            mediaTypes:
              ImagePicker.MediaTypeOptions.Images,

            allowsMultipleSelection: true,

            allowsEditing: false,

            quality: 1,
          });

        if (result.canceled) {
          return;
        }

        const selected =
          result.assets.map(
            (asset, index) => ({
              uri: asset.uri,

              name:
                asset.fileName ||
                `property-${Date.now()}-${index + 1}.jpg`,

              type:
                asset.mimeType ||
                "image/jpeg",
            })
          );

        if (!selected.length) {
          return;
        }

        setFiles((previous) => [
          ...previous,
          ...selected,
        ]);

        setGeneratedImages([]);

        setGenerationResults([]);

        generationResultsRef.current =
          [];
      } catch (error) {
        console.error(
          "IMAGE PICK ERROR:",
          error
        );

        Alert.alert(
          "Error",
          "Unable to select images."
        );
      }
    };

  /* =======================================================
     REMOVE PROPERTY IMAGE
  ======================================================= */

  const removeImage =
    (index: number) => {
      setFiles((previous) =>
        previous.filter(
          (_, i) => i !== index
        )
      );

      setGeneratedImages([]);

      setGenerationResults([]);

      generationResultsRef.current =
        [];
    };

  /* =======================================================
     BRAND STATUS
  ======================================================= */

  const hasBrandSettings =
    () => {
      return Boolean(
        agentName.trim() &&
        agentPhone.trim() &&
        savedAgentImage &&
        savedBrokerLogo &&
        savedGoldenBrokerLogo
      );
    };

  /* =======================================================
     PICK BRAND IMAGE
  ======================================================= */

  const pickBrandImage =
    async (
      type:
        | "agent"
        | "broker"
        | "golden"
    ) => {
      try {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            "Permission Required",
            "Please allow photo library access."
          );

          return;
        }

        const result =
          await ImagePicker.launchImageLibraryAsync({
            mediaTypes:
              ImagePicker.MediaTypeOptions.Images,

            allowsEditing: false,

            quality: 1,
          });

        if (result.canceled) {
          return;
        }

        const asset =
          result.assets[0];

        if (!asset) {
          return;
        }

        if (type === "agent") {
          setSavedAgentImage(
            asset.uri
          );
        }

        if (type === "broker") {
          setSavedBrokerLogo(
            asset.uri
          );
        }

        if (type === "golden") {
          setSavedGoldenBrokerLogo(
            asset.uri
          );
        }
      } catch (error) {
        console.error(
          "BRAND IMAGE PICK ERROR:",
          error
        );

        Alert.alert(
          "Error",
          "Unable to select image."
        );
      }
    };

  /* =======================================================
     SAVE BRANDING
  ======================================================= */

  const saveBranding =
    async () => {
      try {
        if (!user?.email) {
          Alert.alert(
            "Error",
            "Admin email not found."
          );

          return;
        }

        if (!agentName.trim()) {
          Alert.alert(
            "Missing Name",
            "Please enter the agent name."
          );

          return;
        }

        if (!agentPhone.trim()) {
          Alert.alert(
            "Missing Phone",
            "Please enter the agent phone number."
          );

          return;
        }

        if (!savedAgentImage) {
          Alert.alert(
            "Missing Agent Image",
            "Please select the Realtor image."
          );

          return;
        }

        if (!savedBrokerLogo) {
          Alert.alert(
            "Missing Brokerage Logo",
            "Please select the brokerage logo."
          );

          return;
        }

        if (!savedGoldenBrokerLogo) {
          Alert.alert(
            "Missing Golden Logo",
            "Please select the golden brokerage logo."
          );

          return;
        }

        setSavingBranding(true);

        const formData =
          new FormData();

        formData.append(
          "adminEmail",
          user.email
        );

        formData.append(
          "agentName",
          agentName
        );

        formData.append(
          "phone",
          agentPhone
        );

        /*
         * Only upload local files.
         *
         * Existing server URLs do not need to be
         * uploaded again.
         */

        if (
          savedAgentImage &&
          savedAgentImage.startsWith(
            "file://"
          )
        ) {
          formData.append(
            "agentImage",
            {
              uri: savedAgentImage,
              name: "agent.jpg",
              type: "image/jpeg",
            } as any
          );
        }

        if (
          savedBrokerLogo &&
          savedBrokerLogo.startsWith(
            "file://"
          )
        ) {
          formData.append(
            "brokerageLogo",
            {
              uri: savedBrokerLogo,
              name: "brokerage-logo.jpg",
              type: "image/jpeg",
            } as any
          );
        }

        if (
          savedGoldenBrokerLogo &&
          savedGoldenBrokerLogo.startsWith(
            "file://"
          )
        ) {
          formData.append(
            "goldenBrokerageLogo",
            {
              uri:
                savedGoldenBrokerLogo,
              name:
                "golden-brokerage-logo.jpg",
              type: "image/jpeg",
            } as any
          );
        }

        await axios.post(
          `${API_URL}/api/design-branding/save`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },

            timeout: 60000,
          }
        );

        Alert.alert(
          "Success",
          "Brand settings saved successfully."
        );

        setShowBrandModal(false);

        await loadBranding();
      } catch (error) {
        console.error(
          "BRANDING SAVE ERROR:",
          error
        );

        let message =
          "Failed to save brand settings.";

        if (
          axios.isAxiosError(error)
        ) {
          message =
            error.response?.data
              ?.message ||
            message;
        }

        Alert.alert(
          "Error",
          message
        );
      } finally {
        setSavingBranding(false);
      }
    };

  /* =======================================================
     CANVAS READY
  ======================================================= */

  const handleCanvasReady =
    useCallback(() => {
      setGenerationDone(true);
    }, []);

  /* =======================================================
     CAPTURE
  ======================================================= */

  const captureCurrentDesign =
    async () => {
      if (!canvasRef.current) {
        throw new Error(
          "Design canvas is not ready."
        );
      }

      const size =
        getDesignSize(design);

      const uri =
        await captureRef(
          canvasRef.current,
          {
            format: "jpg",
            quality: 0.95,

            width: size.width,
            height: size.height,

            result: "tmpfile",
          }
        );

      return uri;
    };

  /* =======================================================
     GENERATION EFFECT
  ======================================================= */

  useEffect(() => {
    if (
      generationIndex === null ||
      !generationDone
    ) {
      return;
    }

    let cancelled = false;

    const processImage =
      async () => {
        try {
          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                350
              )
          );

          if (cancelled) {
            return;
          }

          console.log(
            `🖼 Capturing image ${generationIndex + 1
            }/${files.length}`
          );

          const uri =
            await captureCurrentDesign();

          if (cancelled) {
            return;
          }

          const previousResults =
            generationResultsRef.current;

          const newResults = [
            ...previousResults,
            uri,
          ];

          generationResultsRef.current =
            newResults;

          setGenerationResults(
            newResults
          );

          /* =============================================
             NEXT IMAGE
          ============================================= */

          if (
            generationIndex + 1 <
            files.length
          ) {
            setGenerationDone(
              false
            );

            setGenerationIndex(
              generationIndex + 1
            );

            return;
          }

          /* =============================================
             ALL IMAGES COMPLETE
          ============================================= */

          setGenerationIndex(
            null
          );

          setGenerationDone(
            false
          );

          setGenerating(
            false
          );

          setGeneratedImages(
            newResults
          );

          console.log(
            "===================================="
          );

          console.log(
            "IMAGE GENERATION COMPLETE"
          );

          console.log(
            "Generated:",
            newResults.length
          );

          console.log(
            "===================================="
          );

          /* =============================================
             SAVE TO GALLERY
          ============================================= */

          try {
            const permission =
              await MediaLibrary.requestPermissionsAsync();

            if (
              permission.granted
            ) {
              for (
                const generatedUri of
                newResults
              ) {
                try {
                  await MediaLibrary.createAssetAsync(
                    generatedUri
                  );
                } catch (
                saveError
                ) {
                  console.error(
                    "GALLERY SAVE ERROR:",
                    saveError
                  );
                }
              }

              Alert.alert(
                "Success",
                `${newResults.length} image(s) generated and saved to your gallery.`
              );
            } else {
              Alert.alert(
                "Generated",
                `${newResults.length} image(s) generated successfully. Gallery permission was not granted.`
              );
            }
          } catch (
          galleryError
          ) {
            console.error(
              "MEDIA LIBRARY ERROR:",
              galleryError
            );

            Alert.alert(
              "Generated",
              `${newResults.length} image(s) generated successfully.`
            );
          }
        } catch (error) {
          console.error(
            "IMAGE CAPTURE ERROR:",
            error
          );

          setGenerating(false);

          setGenerationIndex(
            null
          );

          setGenerationDone(
            false
          );

          Alert.alert(
            "Generation Failed",
            error instanceof Error
              ? error.message
              : "Failed to generate image."
          );
        }
      };

    processImage();

    return () => {
      cancelled = true;
    };
  }, [
    generationIndex,
    generationDone,
    files,
    design,
    agentName,
    agentPhone,
    savedAgentImage,
    savedBrokerLogo,
    savedGoldenBrokerLogo,
  ]);

  /* =======================================================
     GENERATE
  ======================================================= */

  const handleGenerate =
    () => {
      if (!files.length) {
        Alert.alert(
          "Images Required",
          "Please upload at least one property image."
        );

        return;
      }

      if (
        !hasBrandSettings()
      ) {
        Alert.alert(
          "Brand Settings Required",
          "Please complete Brand Settings before generating designs.",
          [
            {
              text: "Open Settings",
              onPress: () =>
                setShowBrandModal(
                  true
                ),
            },

            {
              text: "Cancel",
              style: "cancel",
            },
          ]
        );

        return;
      }

      const logo =
        design.startsWith("social")
          ? savedBrokerLogo
          : savedGoldenBrokerLogo;

      if (!logo) {
        Alert.alert(
          "Logo Required",
          "The required brokerage logo is missing."
        );

        return;
      }

      console.log(
        "===================================="
      );

      console.log(
        "IMAGE GENERATION START"
      );

      console.log(
        "Design:",
        design
      );

      console.log(
        "Files:",
        files.length
      );

      console.log(
        "Admin:",
        user?.email
      );

      console.log(
        "===================================="
      );

      generationResultsRef.current =
        [];

      setGenerating(true);

      setGenerationResults([]);

      setGeneratedImages([]);

      setGenerationDone(false);

      setGenerationIndex(0);
    };

  /* =======================================================
     CURRENT DESIGN
  ======================================================= */

  const currentDesign =
    designs.find(
      (item) =>
        item.id === design
    );

  /* =======================================================
     CURRENT PROPERTY
  ======================================================= */

  const currentProperty =
    generationIndex !== null &&
      files[generationIndex]
      ? files[generationIndex]
      : null;

  /* =======================================================
     CURRENT LOGO
  ======================================================= */

  const currentLogo =
    design.startsWith("social")
      ? savedBrokerLogo
      : savedGoldenBrokerLogo;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <View className="flex-1 bg-slate-50">

      {/* =================================================
          HIDDEN GENERATION CANVAS
      ================================================= */}

      {currentProperty &&
        currentLogo &&
        savedAgentImage ? (
        <DesignCanvas
          key={`${design}-${generationIndex}-${currentProperty.uri}`}
          design={design}
          propertyImage={
            currentProperty.uri
          }
          agentImage={
            savedAgentImage
          }
          logo={currentLogo}
          agentName={agentName}
          phone={agentPhone}
          canvasRef={canvasRef}
          onReady={
            handleCanvasReady
          }
        />
      ) : null}

      {/* =================================================
          MAIN SCROLL
      ================================================= */}

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerClassName="p-4 pb-12"
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <View className="mb-6">

          <View className="flex-row items-start justify-between">

            <View className="mr-3 flex-1">

              <Text className="text-3xl font-bold text-slate-900">
                Image Design Studio
              </Text>

              <Text className="mt-2 text-sm leading-5 text-slate-500">
                Upload images, choose a template,
                and generate your Realtor marketing
                designs.
              </Text>

            </View>

            <Pressable
              onPress={() =>
                setShowBrandModal(
                  true
                )
              }
              className="rounded-xl bg-slate-900 p-3"
            >
              <Ionicons
                name="settings-outline"
                size={21}
                color="#FFFFFF"
              />
            </Pressable>

          </View>

        </View>

        {/* =================================================
            UPLOAD SECTION
        ================================================= */}

        <View className="mb-6 rounded-3xl border border-slate-200 bg-white p-5">

          <SectionHeader
            title="Upload Images"
            description="Select one or multiple property images."
            badge={
              files.length
                ? `${files.length} Files`
                : undefined
            }
          />

          <Pressable
            onPress={pickImages}
            disabled={generating}
            className={`items-center justify-center rounded-2xl border-2 border-dashed py-10 ${generating
              ? "border-slate-200 bg-slate-100"
              : "border-slate-300 bg-slate-50"
              }`}
          >

            <View className="mb-3 rounded-full bg-blue-50 p-4">

              <Ionicons
                name="cloud-upload-outline"
                size={32}
                color="#2563EB"
              />

            </View>

            <Text className="text-lg font-semibold text-slate-900">
              Upload Images
            </Text>

            <Text className="mt-1 text-center text-sm text-slate-500">
              Tap here to choose property photos
            </Text>

            <Text className="mt-2 text-xs text-slate-400">
              JPG • PNG • WEBP
            </Text>

          </Pressable>

        </View>

        {/* =================================================
            TEMPLATE SECTION
        ================================================= */}

        <View className="mb-6 rounded-3xl border border-slate-200 bg-white p-5">

  <SectionHeader
    title="Choose Design"
    description="Select the same templates available on the website."
  />

  <View className="flex-row flex-wrap justify-between">

    {designs.map((item) => {
      const selected = design === item.id;

      return (
        <Pressable
          key={item.id}
          onPress={() => {
            if (generating) {
              return;
            }

            setDesign(item.id);

            setGeneratedImages([]);
            setGenerationResults([]);

            generationResultsRef.current = [];
          }}
          className={`mb-4 w-[48%] overflow-hidden rounded-2xl border-2 ${
            selected
              ? "border-blue-600 bg-blue-50"
              : "border-slate-200 bg-white"
          }`}
        >
          {/* PREVIEW */}
          <View className="h-52 w-full items-center justify-center overflow-hidden bg-slate-100">

            <Image
              source={item.preview}
              className="h-full w-full"
              resizeMode="contain"
            />

          </View>

          {/* DETAILS */}
          <View className="p-3">

            <Text
              numberOfLines={2}
              className={`text-sm font-bold ${
                selected
                  ? "text-blue-700"
                  : "text-slate-900"
              }`}
            >
              {item.title}
            </Text>

            <Text className="mt-1 text-xs text-slate-500">
              {item.size}
            </Text>

            {selected ? (
              <View className="mt-2 flex-row items-center">

                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color="#2563EB"
                />

                <Text className="ml-1 text-xs font-semibold text-blue-600">
                  Selected
                </Text>

              </View>
            ) : null}

          </View>
        </Pressable>
      );
    })}

  </View>

</View>

        {/* =================================================
            BRAND STATUS
        ================================================= */}

        <View className="mb-6 rounded-3xl border border-slate-200 bg-white p-5">

          <SectionHeader
            title="Brand Settings"
            description="Brand information used in generated designs."
          />

          <View className="rounded-2xl bg-slate-50 p-4">

            <View className="flex-row items-center justify-between border-b border-slate-200 py-3">

              <Text className="text-sm text-slate-500">
                Agent Name
              </Text>

              <Text
                numberOfLines={1}
                className={`ml-4 max-w-[60%] text-right text-sm font-semibold ${agentName
                  ? "text-slate-900"
                  : "text-red-500"
                  }`}
              >
                {agentName ||
                  "Not configured"}
              </Text>

            </View>

            <View className="flex-row items-center justify-between border-b border-slate-200 py-3">

              <Text className="text-sm text-slate-500">
                Phone
              </Text>

              <Text
                className={`text-sm font-semibold ${agentPhone
                  ? "text-slate-900"
                  : "text-red-500"
                  }`}
              >
                {agentPhone ||
                  "Not configured"}
              </Text>

            </View>

            <View className="flex-row items-center justify-between border-b border-slate-200 py-3">

              <Text className="text-sm text-slate-500">
                Agent Image
              </Text>

              <Text
                className={`text-sm font-semibold ${savedAgentImage
                  ? "text-green-600"
                  : "text-red-500"
                  }`}
              >
                {savedAgentImage
                  ? "Configured"
                  : "Required"}
              </Text>

            </View>

            <View className="flex-row items-center justify-between border-b border-slate-200 py-3">

              <Text className="text-sm text-slate-500">
                Brokerage Logo
              </Text>

              <Text
                className={`text-sm font-semibold ${savedBrokerLogo
                  ? "text-green-600"
                  : "text-red-500"
                  }`}
              >
                {savedBrokerLogo
                  ? "Configured"
                  : "Required"}
              </Text>

            </View>

            <View className="flex-row items-center justify-between py-3">

              <Text className="text-sm text-slate-500">
                Golden Logo
              </Text>

              <Text
                className={`text-sm font-semibold ${savedGoldenBrokerLogo
                  ? "text-green-600"
                  : "text-red-500"
                  }`}
              >
                {savedGoldenBrokerLogo
                  ? "Configured"
                  : "Required"}
              </Text>

            </View>

          </View>

          {!hasBrandSettings() ? (
            <View className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">

              <Text className="text-sm leading-5 text-amber-700">
                Complete Brand Settings before
                generating designs.
              </Text>

              <Pressable
                onPress={() =>
                  setShowBrandModal(
                    true
                  )
                }
                className="mt-3 self-start"
              >

                <Text className="text-sm font-semibold text-blue-600">
                  Open Brand Settings →
                </Text>

              </Pressable>

            </View>
          ) : null}

        </View>

        {/* =================================================
            GENERATE BUTTON
        ================================================= */}

        <Pressable
          onPress={
            handleGenerate
          }
          disabled={
            generating ||
            files.length === 0
          }
          className={`mb-6 flex-row items-center justify-center rounded-2xl py-4 ${files.length &&
            !generating
            ? "bg-blue-600"
            : "bg-slate-300"
            }`}
        >

          {generating ? (
            <ActivityIndicator
              color="#FFFFFF"
              size="small"
            />
          ) : (
            <Ionicons
              name="sparkles-outline"
              size={20}
              color="#FFFFFF"
            />
          )}

          <Text className="ml-2 font-semibold text-white">
            {generating
              ? `Generating ${generationIndex !==
                null
                ? generationIndex +
                1
                : ""
              }/${files.length}`
              : "Generate Preview"}
          </Text>

        </Pressable>

        {/* =================================================
            UPLOADED IMAGES
        ================================================= */}

        {files.length > 0 ? (
          <View className="mb-6 rounded-3xl border border-slate-200 bg-white p-4">

            <View className="mb-4 flex-row items-center justify-between">

              <Text className="text-xl font-bold text-slate-900">
                Uploaded Images
              </Text>

              <Text className="text-sm text-slate-500">
                {files.length} Files
              </Text>

            </View>

            <View className="flex-row flex-wrap justify-between">

              {files.map(
                (
                  file,
                  index
                ) => (
                  <View
                    key={`${file.uri}-${index}`}
                    className="mb-4 w-[48%] overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  >

                    <View className="h-44 bg-slate-100">

                      <Image
                        source={{
                          uri: file.uri,
                        }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />

                    </View>

                    <View className="p-3">

                      <Text
                        numberOfLines={1}
                        className="text-xs font-medium text-slate-700"
                      >
                        {file.name}
                      </Text>

                      <Pressable
                        onPress={() =>
                          removeImage(
                            index
                          )
                        }
                        disabled={
                          generating
                        }
                        className="mt-2 flex-row items-center"
                      >

                        <Ionicons
                          name="trash-outline"
                          size={14}
                          color="#DC2626"
                        />

                        <Text className="ml-1 text-xs font-semibold text-red-600">
                          Remove
                        </Text>

                      </Pressable>

                    </View>

                  </View>
                )
              )}

            </View>

          </View>
        ) : null}

        {/* =================================================
            GENERATED IMAGES
        ================================================= */}

        {generatedImages.length >
          0 ? (
          <View className="rounded-3xl border border-slate-200 bg-white p-4">

            <Text className="text-xl font-bold text-slate-900">
              Generated Designs
            </Text>

            <Text className="mt-1 text-sm text-slate-500">
              Your generated Realtor marketing
              images.
            </Text>

            <View className="mt-5">

              {generatedImages.map(
                (
                  uri,
                  index
                ) => (
                  <View
                    key={`${uri}-${index}`}
                    className="mb-5 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50"
                  >

                    <View className="bg-slate-100">

                      <Image
                        source={{
                          uri,
                        }}
                        style={{
                          width: "100%",
                          aspectRatio:
                            design.includes(
                              "landscape"
                            )
                              ? 1200 /
                              800
                              : 1080 /
                              1350,
                        }}
                        resizeMode="contain"
                      />

                    </View>

                    <View className="flex-row items-center justify-between p-4">

                      <View className="flex-1">

                        <Text className="font-semibold text-slate-900">
                          Image{" "}
                          {index + 1}
                        </Text>

                        <Text className="mt-1 text-xs text-slate-500">
                          {currentDesign?.title ||
                            "Generated Design"}
                        </Text>

                      </View>

                      <View className="rounded-xl bg-green-50 px-3 py-2">

                        <Text className="text-xs font-semibold text-green-700">
                          Saved
                        </Text>

                      </View>

                    </View>

                  </View>
                )
              )}

            </View>

          </View>
        ) : null}

      </ScrollView>

      {/* =================================================
          BRAND SETTINGS MODAL
      ================================================= */}

      <Modal
        visible={
          showBrandModal
        }
        animationType="slide"
        transparent
        onRequestClose={() =>
          setShowBrandModal(
            false
          )
        }
      >

        <View className="flex-1 justify-end bg-black/40">

          <View className="max-h-[92%] rounded-t-[32px] bg-white">

            {/* HEADER */}

            <View className="flex-row items-center justify-between border-b border-slate-200 px-5 py-4">

              <View>

                <Text className="text-xl font-bold text-slate-900">
                  Brand Settings
                </Text>

                <Text className="mt-1 text-xs text-slate-500">
                  Configure your Realtor branding
                </Text>

              </View>

              <Pressable
                onPress={() =>
                  setShowBrandModal(
                    false
                  )
                }
                className="rounded-full bg-slate-100 p-2"
              >

                <Ionicons
                  name="close"
                  size={22}
                  color="#374151"
                />

              </Pressable>

            </View>

            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
              contentContainerClassName="p-5 pb-10"
            >

              {/* =================================================
                  AGENT NAME
              ================================================= */}

              <Text className="mb-2 text-sm font-semibold text-slate-700">
                Agent Name
              </Text>

              <TextInput
                value={agentName}
                onChangeText={
                  setAgentName
                }
                placeholder="Enter agent name"
                placeholderTextColor="#94A3B8"
                className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base text-slate-900"
              />

              {/* =================================================
                  PHONE
              ================================================= */}

              <Text className="mb-2 text-sm font-semibold text-slate-700">
                Phone Number
              </Text>

              <TextInput
                value={agentPhone}
                onChangeText={
                  setAgentPhone
                }
                placeholder="Enter phone number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-base text-slate-900"
              />

              {/* =================================================
                  AGENT IMAGE
              ================================================= */}

              <View className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">

                <Text className="mb-3 text-sm font-bold text-slate-900">
                  Realtor Image
                </Text>

                <View className="flex-row items-center">

                  <View className="h-24 w-24 overflow-hidden rounded-2xl bg-slate-200">

                    {savedAgentImage ? (
                      <Image
                        source={{
                          uri: savedAgentImage,
                        }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="h-full w-full items-center justify-center">

                        <Ionicons
                          name="person-outline"
                          size={30}
                          color="#94A3B8"
                        />

                      </View>
                    )}

                  </View>

                  <View className="ml-4 flex-1">

                    <Text className="text-xs leading-5 text-slate-500">
                      Use the same transparent or
                      portrait Realtor image used
                      by the website.
                    </Text>

                    <Pressable
                      onPress={() =>
                        pickBrandImage(
                          "agent"
                        )
                      }
                      className="mt-3 self-start rounded-xl bg-blue-600 px-4 py-2.5"
                    >

                      <Text className="text-sm font-semibold text-white">
                        Choose Image
                      </Text>

                    </Pressable>

                  </View>

                </View>

              </View>

              {/* =================================================
                  BROKER LOGO
              ================================================= */}

              <View className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">

                <Text className="mb-3 text-sm font-bold text-slate-900">
                  Brokerage Logo
                </Text>

                <View className="h-28 items-center justify-center rounded-xl bg-white">

                  {savedBrokerLogo ? (
                    <Image
                      source={{
                        uri: savedBrokerLogo,
                      }}
                      className="h-full w-full"
                      resizeMode="contain"
                    />
                  ) : (
                    <Ionicons
                      name="image-outline"
                      size={32}
                      color="#94A3B8"
                    />
                  )}

                </View>

                <Pressable
                  onPress={() =>
                    pickBrandImage(
                      "broker"
                    )
                  }
                  className="mt-3 items-center rounded-xl bg-slate-900 py-3"
                >

                  <Text className="text-sm font-semibold text-white">
                    Choose Brokerage Logo
                  </Text>

                </Pressable>

              </View>

              {/* =================================================
                  GOLDEN LOGO
              ================================================= */}

              <View className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">

                <Text className="mb-3 text-sm font-bold text-slate-900">
                  Golden Brokerage Logo
                </Text>

                <View className="h-28 items-center justify-center rounded-xl bg-white">

                  {savedGoldenBrokerLogo ? (
                    <Image
                      source={{
                        uri: savedGoldenBrokerLogo,
                      }}
                      className="h-full w-full"
                      resizeMode="contain"
                    />
                  ) : (
                    <Ionicons
                      name="image-outline"
                      size={32}
                      color="#94A3B8"
                    />
                  )}

                </View>

                <Pressable
                  onPress={() =>
                    pickBrandImage(
                      "golden"
                    )
                  }
                  className="mt-3 items-center rounded-xl bg-slate-900 py-3"
                >

                  <Text className="text-sm font-semibold text-white">
                    Choose Golden Logo
                  </Text>

                </Pressable>

              </View>

              {/* =================================================
                  SAVE
              ================================================= */}

              <Pressable
                onPress={
                  saveBranding
                }
                disabled={
                  savingBranding
                }
                className={`flex-row items-center justify-center rounded-2xl py-4 ${savingBranding
                  ? "bg-slate-300"
                  : "bg-blue-600"
                  }`}
              >

                {savingBranding ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Ionicons
                    name="save-outline"
                    size={19}
                    color="#FFFFFF"
                  />
                )}

                <Text className="ml-2 font-semibold text-white">
                  {savingBranding
                    ? "Saving..."
                    : "Save Brand Settings"}
                </Text>

              </Pressable>

            </ScrollView>

          </View>

        </View>

      </Modal>

    </View>
  );
}










































// import React, {
//   useCallback,
//   useEffect,
//   useRef,
//   useState,
// } from "react";

// import {
//   ActivityIndicator,
//   Alert,
//   Image,
//   Modal,
//   Pressable,
//   ScrollView,
//   Text,
//   TextInput,
//   View,
// } from "react-native";

// import * as ImagePicker from "expo-image-picker";
// import * as MediaLibrary from "expo-media-library";

// import { captureRef } from "react-native-view-shot";

// import { Ionicons } from "@expo/vector-icons";

// import axios from "axios";

// import { useAuth } from "../../contexts/AuthContext";

// /* =========================================================
//    TYPES
// ========================================================= */

// type DesignType =
//   | "social-portrait"
//   | "social-landscape"
//   | "blog-portrait"
//   | "blog-landscape"
//   | "social-portrait2"
//   | "social-landscape2";

// interface SelectedImage {
//   uri: string;
//   name: string;
//   type: string;
// }

// interface Design {
//   id: DesignType;
//   title: string;
//   size: string;
//   description: string;
//   preview: any;
// }

// interface Branding {
//   agentName?: string;
//   phone?: string;
//   agentImage?: string;
//   brokerageLogo?: string;
//   goldenBrokerageLogo?: string;
// }

// /* =========================================================
//    CONFIG
// ========================================================= */

// const API_URL = "https://realtorparth.ca";

// /*
//  * IMPORTANT
//  *
//  * These must exist in:
//  *
//  * assets/images/
//  */

// const designs: Design[] = [
//   {
//     id: "social-portrait",
//     title: "White & Black Portrait",
//     size: "1080 × 1350",
//     description: "Professional Realtor Marketing Template",
//     preview: require("../../assets/images/social-portrait.jpg"),
//   },

//   {
//     id: "social-landscape",
//     title: "White & Black Landscape",
//     size: "1200 × 800",
//     description: "Professional Realtor Marketing Template",
//     preview: require("../../assets/images/social-landscape.jpg"),
//   },

//   {
//     id: "blog-portrait",
//     title: "Golden & Black Portrait",
//     size: "1080 × 1350",
//     description: "Professional Realtor Marketing Template",
//     preview: require("../../assets/images/blog-portrait.jpg"),
//   },

//   {
//     id: "blog-landscape",
//     title: "Golden & Black Landscape",
//     size: "1200 × 800",
//     description: "Professional Realtor Marketing Template",
//     preview: require("../../assets/images/blog-landscape.jpg"),
//   },

//   {
//     id: "social-portrait2",
//     title: "Premium White & Brown Portrait",
//     size: "1080 × 1350",
//     description: "Premium Realtor Marketing Template",
//     preview: require("../../assets/images/social-portrait2.jpg"),
//   },

//   {
//     id: "social-landscape2",
//     title: "Premium White & Brown Landscape",
//     size: "1200 × 800",
//     description: "Premium Realtor Marketing Template",
//     preview: require("../../assets/images/blog-landscape2.jpg"),
//   },
// ];

// /* =========================================================
//    SECTION HEADER
// ========================================================= */

// function SectionHeader({
//   title,
//   description,
//   badge,
// }: {
//   title: string;
//   description?: string;
//   badge?: string;
// }) {
//   return (
//     <View className="mb-5">
//       <View className="flex-row items-center justify-between">
//         <View className="mr-3 flex-1">
//           <Text className="text-xl font-bold text-slate-900">
//             {title}
//           </Text>

//           {description ? (
//             <Text className="mt-1 text-sm leading-5 text-slate-500">
//               {description}
//             </Text>
//           ) : null}
//         </View>

//         {badge ? (
//           <View className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
//             <Text className="text-xs font-semibold text-blue-700">
//               {badge}
//             </Text>
//           </View>
//         ) : null}
//       </View>
//     </View>
//   );
// }

// /* =========================================================
//    DESIGN SIZE
// ========================================================= */

// function getDesignSize(design: DesignType) {
//   switch (design) {
//     case "social-portrait":
//     case "blog-portrait":
//     case "social-portrait2":
//       return {
//         width: 1080,
//         height: 1350,
//       };

//     case "social-landscape":
//     case "blog-landscape":
//     case "social-landscape2":
//       return {
//         width: 1200,
//         height: 800,
//       };

//     default:
//       return {
//         width: 1080,
//         height: 1350,
//       };
//   }
// }

// /* =========================================================
//    SCALE IMAGE COVER
// ========================================================= */

// function getCoverStyle(
//   imageWidth: number,
//   imageHeight: number,
//   targetWidth: number,
//   targetHeight: number
// ) {
//   if (!imageWidth || !imageHeight) {
//     return {
//       width: targetWidth,
//       height: targetHeight,
//       left: 0,
//       top: 0,
//     };
//   }

//   const imageRatio = imageWidth / imageHeight;
//   const targetRatio = targetWidth / targetHeight;

//   let width = targetWidth;
//   let height = targetHeight;

//   if (imageRatio > targetRatio) {
//     height = targetHeight;
//     width = height * imageRatio;
//   } else {
//     width = targetWidth;
//     height = width / imageRatio;
//   }

//   return {
//     width,
//     height,
//     left: (targetWidth - width) / 2,
//     top: (targetHeight - height) / 2,
//   };
// }

// /* =========================================================
//    DESIGN CANVAS
// ========================================================= */

// interface DesignCanvasProps {
//   design: DesignType;
//   propertyImage: string;
//   agentImage: string;
//   logo: string;
//   agentName: string;
//   phone: string;
//   canvasRef: React.RefObject<View>;
//   onReady: () => void;
// }

// function DesignCanvas({
//   design,
//   propertyImage,
//   agentImage,
//   logo,
//   agentName,
//   phone,
//   canvasRef,
//   onReady,
// }: DesignCanvasProps) {
//   const [propertyLoaded, setPropertyLoaded] = useState(false);
//   const [agentLoaded, setAgentLoaded] = useState(false);
//   const [logoLoaded, setLogoLoaded] = useState(false);

//   const size = getDesignSize(design);

//   const displayName = (
//     agentName || "PARTH BRAHMBHATT"
//   ).toUpperCase();

//   const displayPhone =
//     phone || "403-439-1555";

//   const ready =
//     propertyLoaded &&
//     agentLoaded &&
//     logoLoaded;

//   useEffect(() => {
//     if (!ready) {
//       return;
//     }

//     const timer = setTimeout(() => {
//       onReady();
//     }, 250);

//     return () => clearTimeout(timer);
//   }, [
//     ready,
//     onReady,
//   ]);

//   /*
//    * Property image occupies entire design.
//    */

//   const propertyCover = getCoverStyle(
//     1600,
//     1000,
//     size.width,
//     size.height
//   );

//   return (
//     <View
//       ref={canvasRef}
//       collapsable={false}
//       style={{
//         width: size.width,
//         height: size.height,
//         backgroundColor: "#ffffff",
//         overflow: "hidden",
//         position: "absolute",
//         left: -5000,
//         top: 0,
//       }}
//     >
//       {/* =================================================
//           PROPERTY IMAGE
//       ================================================= */}

//       <Image
//         source={{
//           uri: propertyImage,
//         }}
//         onLoad={() =>
//           setPropertyLoaded(true)
//         }
//         style={{
//           position: "absolute",
//           width: propertyCover.width,
//           height: propertyCover.height,
//           left: propertyCover.left,
//           top: propertyCover.top,
//         }}
//         resizeMode="cover"
//       />

//       {/* =================================================
//           SOCIAL PORTRAIT
//       ================================================= */}

//       {design === "social-portrait" && (
//         <>
//           {/* REALTOR */}

//           <Image
//             source={{
//               uri: agentImage,
//             }}
//             onLoad={() =>
//               setAgentLoaded(true)
//             }
//             style={{
//               position: "absolute",
//               width: 700,
//               height: 900,
//               right: -20,
//               top: 400,
//             }}
//             resizeMode="contain"
//           />

//           {/* FOOTER LEFT */}

//           <View
//             style={{
//               position: "absolute",
//               left: 0,
//               top: 1150,
//               width: 360,
//               height: 200,
//               backgroundColor: "#ffffff",
//             }}
//           >
//             <Image
//               source={{
//                 uri: logo,
//               }}
//               onLoad={() =>
//                 setLogoLoaded(true)
//               }
//               style={{
//                 width: 360,
//                 height: 190,
//                 marginTop: 5,
//               }}
//               resizeMode="contain"
//             />
//           </View>

//           {/* FOOTER RIGHT */}

//           <View
//             style={{
//               position: "absolute",
//               left: 360,
//               top: 1150,
//               width: 720,
//               height: 200,
//               backgroundColor: "#111111",
//               alignItems: "center",
//               justifyContent: "center",
//             }}
//           >
//             <Text
//               style={{
//                 color: "#ffffff",
//                 fontSize: 44,
//                 fontWeight: "700",
//                 textAlign: "center",
//                 position: "absolute",
//                 top: 68,
//                 width: 720,
//               }}
//             >
//               {displayPhone}
//             </Text>

//             <Text
//               style={{
//                 color: "#ffffff",
//                 fontSize: 48,
//                 fontWeight: "800",
//                 textAlign: "center",
//                 position: "absolute",
//                 top: 130,
//                 width: 720,
//               }}
//               numberOfLines={1}
//               adjustsFontSizeToFit
//             >
//               {displayName}
//             </Text>

//             <Text
//               style={{
//                 color: "#d4d4d4",
//                 fontSize: 24,
//                 fontWeight: "500",
//                 textAlign: "center",
//                 position: "absolute",
//                 top: 178,
//                 width: 720,
//               }}
//             >
//               REALTOR
//             </Text>
//           </View>
//         </>
//       )}

//       {/* =================================================
//           SOCIAL LANDSCAPE
//       ================================================= */}

//       {design === "social-landscape" && (
//         <>
//           {/* REALTOR */}

//           <Image
//             source={{
//               uri: agentImage,
//             }}
//             onLoad={() =>
//               setAgentLoaded(true)
//             }
//             style={{
//               position: "absolute",
//               width: 540,
//               height: 720,
//               right: -70,
//               top: 120,
//             }}
//             resizeMode="contain"
//           />

//           {/* WHITE FOOTER */}

//           <View
//             style={{
//               position: "absolute",
//               left: 0,
//               top: 650,
//               width: 320,
//               height: 150,
//               backgroundColor: "#ffffff",
//             }}
//           >
//             <Image
//               source={{
//                 uri: logo,
//               }}
//               onLoad={() =>
//                 setLogoLoaded(true)
//               }
//               style={{
//                 width: 320,
//                 height: 150,
//               }}
//               resizeMode="contain"
//             />
//           </View>

//           {/* BLACK FOOTER */}

//           <View
//             style={{
//               position: "absolute",
//               left: 320,
//               top: 650,
//               width: 880,
//               height: 150,
//               backgroundColor: "#111111",
//             }}
//           >
//             <Text
//               style={{
//                 position: "absolute",
//                 width: 880,
//                 top: 42,
//                 textAlign: "center",
//                 color: "#ffffff",
//                 fontSize: 34,
//                 fontWeight: "800",
//               }}
//               numberOfLines={1}
//               adjustsFontSizeToFit
//             >
//               {displayName}
//             </Text>

//             <Text
//               style={{
//                 position: "absolute",
//                 width: 880,
//                 top: 82,
//                 textAlign: "center",
//                 color: "#ffffff",
//                 fontSize: 30,
//                 fontWeight: "400",
//               }}
//             >
//               Realtor
//             </Text>

//             <Text
//               style={{
//                 position: "absolute",
//                 width: 880,
//                 top: 122,
//                 textAlign: "center",
//                 color: "#ffffff",
//                 fontSize: 36,
//                 fontWeight: "500",
//               }}
//             >
//               {displayPhone}
//             </Text>
//           </View>
//         </>
//       )}

//       {/* =================================================
//           BLOG PORTRAIT
//       ================================================= */}

//       {design === "blog-portrait" && (
//         <>
//           <Image
//             source={{
//               uri: agentImage,
//             }}
//             onLoad={() =>
//               setAgentLoaded(true)
//             }
//             style={{
//               position: "absolute",
//               width: 700,
//               height: 900,
//               right: -20,
//               top: 400,
//             }}
//             resizeMode="contain"
//           />

//           {/* WHITE LOGO */}

//           <View
//             style={{
//               position: "absolute",
//               left: 0,
//               top: 1150,
//               width: 360,
//               height: 200,
//               backgroundColor: "#ffffff",
//             }}
//           >
//             <Image
//               source={{
//                 uri: logo,
//               }}
//               onLoad={() =>
//                 setLogoLoaded(true)
//               }
//               style={{
//                 width: 365,
//                 height: 200,
//               }}
//               resizeMode="contain"
//             />
//           </View>

//           {/* BLACK CONTACT */}

//           <View
//             style={{
//               position: "absolute",
//               left: 360,
//               top: 1150,
//               width: 720,
//               height: 200,
//               backgroundColor: "#111111",
//             }}
//           >
//             <Text
//               style={{
//                 position: "absolute",
//                 width: 720,
//                 top: 68,
//                 textAlign: "center",
//                 color: "#d6a72b",
//                 fontSize: 44,
//                 fontWeight: "700",
//               }}
//             >
//               {displayPhone}
//             </Text>

//             <Text
//               style={{
//                 position: "absolute",
//                 width: 720,
//                 top: 130,
//                 textAlign: "center",
//                 color: "#d6a72b",
//                 fontSize: 48,
//                 fontWeight: "800",
//               }}
//               numberOfLines={1}
//               adjustsFontSizeToFit
//             >
//               {displayName}
//             </Text>

//             <Text
//               style={{
//                 position: "absolute",
//                 width: 720,
//                 top: 178,
//                 textAlign: "center",
//                 color: "#d6a72b",
//                 fontSize: 24,
//                 fontWeight: "500",
//               }}
//             >
//               REALTOR
//             </Text>
//           </View>
//         </>
//       )}

//       {/* =================================================
//           BLOG LANDSCAPE
//       ================================================= */}

//       {design === "blog-landscape" && (
//         <>
//           <Image
//             source={{
//               uri: agentImage,
//             }}
//             onLoad={() =>
//               setAgentLoaded(true)
//             }
//             style={{
//               position: "absolute",
//               width: 540,
//               height: 720,
//               right: -70,
//               top: 120,
//             }}
//             resizeMode="contain"
//           />

//           <View
//             style={{
//               position: "absolute",
//               left: 0,
//               top: 650,
//               width: 320,
//               height: 150,
//               backgroundColor: "#ffffff",
//             }}
//           >
//             <Image
//               source={{
//                 uri: logo,
//               }}
//               onLoad={() =>
//                 setLogoLoaded(true)
//               }
//               style={{
//                 width: 320,
//                 height: 150,
//               }}
//               resizeMode="contain"
//             />
//           </View>

//           <View
//             style={{
//               position: "absolute",
//               left: 320,
//               top: 650,
//               width: 880,
//               height: 150,
//               backgroundColor: "#111111",
//             }}
//           >
//             <Text
//               style={{
//                 position: "absolute",
//                 width: 880,
//                 top: 42,
//                 textAlign: "center",
//                 color: "#d6a72b",
//                 fontSize: 34,
//                 fontWeight: "800",
//               }}
//               numberOfLines={1}
//               adjustsFontSizeToFit
//             >
//               {displayName}
//             </Text>

//             <Text
//               style={{
//                 position: "absolute",
//                 width: 880,
//                 top: 82,
//                 textAlign: "center",
//                 color: "#d6a72b",
//                 fontSize: 30,
//                 fontWeight: "400",
//               }}
//             >
//               Realtor
//             </Text>

//             <Text
//               style={{
//                 position: "absolute",
//                 width: 880,
//                 top: 122,
//                 textAlign: "center",
//                 color: "#d6a72b",
//                 fontSize: 36,
//                 fontWeight: "500",
//               }}
//             >
//               {displayPhone}
//             </Text>
//           </View>
//         </>
//       )}

//       {/* =================================================
//           PREMIUM PORTRAIT 2
//       ================================================= */}

//       {design === "social-portrait2" && (
//         <>
//           <Image
//             source={{
//               uri: agentImage,
//             }}
//             onLoad={() =>
//               setAgentLoaded(true)
//             }
//             style={{
//               position: "absolute",
//               width: 700,
//               height: 900,
//               right: -20,
//               top: 400,
//             }}
//             resizeMode="contain"
//           />

//           <View
//             style={{
//               position: "absolute",
//               left: 0,
//               top: 1160,
//               width: 280,
//               height: 190,
//               backgroundColor: "#ffffff",
//             }}
//           >
//             <Image
//               source={{
//                 uri: logo,
//               }}
//               onLoad={() =>
//                 setLogoLoaded(true)
//               }
//               style={{
//                 width: 255,
//                 height: 175,
//                 marginLeft: 12,
//                 marginTop: 8,
//               }}
//               resizeMode="contain"
//             />
//           </View>

//           <View
//             style={{
//               position: "absolute",
//               left: 280,
//               top: 1160,
//               width: 800,
//               height: 190,
//               backgroundColor: "#4b2b2b",
//             }}
//           >
//             <Text
//               style={{
//                 position: "absolute",
//                 left: 35,
//                 top: 48,
//                 color: "#ffffff",
//                 fontSize: 38,
//                 fontWeight: "800",
//               }}
//               numberOfLines={1}
//               adjustsFontSizeToFit
//             >
//               {displayName}
//             </Text>

//             <Text
//               style={{
//                 position: "absolute",
//                 left: 170,
//                 top: 100,
//                 color: "#ffffff",
//                 fontSize: 30,
//                 fontWeight: "400",
//               }}
//             >
//               Realtor
//             </Text>

//             <Text
//               style={{
//                 position: "absolute",
//                 left: 100,
//                 top: 150,
//                 color: "#ffffff",
//                 fontSize: 38,
//                 fontWeight: "500",
//               }}
//             >
//               {displayPhone}
//             </Text>
//           </View>
//         </>
//       )}

//       {/* =================================================
//           PREMIUM LANDSCAPE 2
//       ================================================= */}

//       {design === "social-landscape2" && (
//         <>
//           {/* WHITE LOGO AREA */}

//           <View
//             style={{
//               position: "absolute",
//               left: 0,
//               top: 650,
//               width: 300,
//               height: 150,
//               backgroundColor: "#ffffff",
//             }}
//           >
//             <Image
//               source={{
//                 uri: logo,
//               }}
//               onLoad={() =>
//                 setLogoLoaded(true)
//               }
//               style={{
//                 width: 285,
//                 height: 140,
//                 marginLeft: 8,
//                 marginTop: 5,
//               }}
//               resizeMode="contain"
//             />
//           </View>

//           {/* BROWN AREA */}

//           <View
//             style={{
//               position: "absolute",
//               left: 300,
//               top: 650,
//               width: 900,
//               height: 150,
//               backgroundColor: "#4b2b2b",
//             }}
//           >
//             <Text
//               style={{
//                 position: "absolute",
//                 width: 900,
//                 top: 40,
//                 textAlign: "center",
//                 color: "#ffffff",
//                 fontSize: 34,
//                 fontWeight: "800",
//               }}
//               numberOfLines={1}
//               adjustsFontSizeToFit
//             >
//               {displayName}
//             </Text>

//             <Text
//               style={{
//                 position: "absolute",
//                 width: 900,
//                 top: 80,
//                 textAlign: "center",
//                 color: "#ffffff",
//                 fontSize: 30,
//                 fontWeight: "400",
//               }}
//             >
//               Realtor
//             </Text>

//             <Text
//               style={{
//                 position: "absolute",
//                 width: 900,
//                 top: 122,
//                 textAlign: "center",
//                 color: "#ffffff",
//                 fontSize: 36,
//                 fontWeight: "500",
//               }}
//             >
//               {displayPhone}
//             </Text>
//           </View>

//           {/* REALTOR */}

//           <Image
//             source={{
//               uri: agentImage,
//             }}
//             onLoad={() =>
//               setAgentLoaded(true)
//             }
//             style={{
//               position: "absolute",
//               width: 560,
//               height: 560,
//               left: 740,
//               bottom: 0,
//             }}
//             resizeMode="contain"
//           />
//         </>
//       )}

//       {/* =================================================
//           LOADING COVER
//       ================================================= */}

//       {!ready && (
//         <View
//           style={{
//             position: "absolute",
//             left: 0,
//             top: 0,
//             width: size.width,
//             height: size.height,
//             backgroundColor: "#ffffff",
//             alignItems: "center",
//             justifyContent: "center",
//           }}
//         >
//           <ActivityIndicator
//             size="large"
//             color="#2563EB"
//           />

//           <Text
//             style={{
//               marginTop: 20,
//               color: "#64748B",
//               fontSize: 28,
//               fontWeight: "600",
//             }}
//           >
//             Preparing design...
//           </Text>
//         </View>
//       )}
//     </View>
//   );
// }

// /* =========================================================
//    MAIN SCREEN
// ========================================================= */

// export default function CreateImageScreen() {
//   const { user } = useAuth();

//   /* =====================================================
//      FILES
//   ===================================================== */

//   const [
//     files,
//     setFiles,
//   ] = useState<SelectedImage[]>([]);

//   /* =====================================================
//      DESIGN
//   ===================================================== */

//   const [
//     design,
//     setDesign,
//   ] = useState<DesignType>(
//     "social-portrait"
//   );

//   /* =====================================================
//      BRANDING
//   ===================================================== */

//   const [
//     agentName,
//     setAgentName,
//   ] = useState("");

//   const [
//     agentPhone,
//     setAgentPhone,
//   ] = useState("");

//   const [
//     savedAgentImage,
//     setSavedAgentImage,
//   ] = useState("");

//   const [
//     savedBrokerLogo,
//     setSavedBrokerLogo,
//   ] = useState("");

//   const [
//     savedGoldenBrokerLogo,
//     setSavedGoldenBrokerLogo,
//   ] = useState("");

//   /* =====================================================
//      BRAND MODAL
//   ===================================================== */

//   const [
//     showBrandModal,
//     setShowBrandModal,
//   ] = useState(false);

//   const [
//     savingBranding,
//     setSavingBranding,
//   ] = useState(false);

//   /* =====================================================
//      GENERATION
//   ===================================================== */

//   const [
//     generating,
//     setGenerating,
//   ] = useState(false);

//   const [
//     generatedImages,
//     setGeneratedImages,
//   ] = useState<string[]>([]);

//   /* =====================================================
//      GENERATION REF
//   ===================================================== */

//   const canvasRef =
//     useRef<View>(null);

//   const [
//     generationIndex,
//     setGenerationIndex,
//   ] = useState<number | null>(null);

//   const [
//     generationDone,
//     setGenerationDone,
//   ] = useState(false);

//   const [
//     generationResults,
//     setGenerationResults,
//   ] = useState<string[]>([]);

//   /* =====================================================
//      LOAD BRANDING
//   ===================================================== */

//   const loadBranding =
//     useCallback(
//       async () => {
//         try {
//           const adminEmail =
//             user?.email;

//           if (!adminEmail) {
//             return;
//           }

//           console.log(
//             "Loading branding for:",
//             adminEmail
//           );

//           const response =
//             await axios.get(
//               `${API_URL}/api/design-branding/${encodeURIComponent(
//                 adminEmail
//               )}`
//             );

//           const branding:
//             Branding =
//             response.data?.branding;

//           if (!branding) {
//             return;
//           }

//           setAgentName(
//             branding.agentName ||
//             ""
//           );

//           setAgentPhone(
//             branding.phone ||
//             ""
//           );

//           setSavedAgentImage(
//             branding.agentImage ||
//             ""
//           );

//           setSavedBrokerLogo(
//             branding.brokerageLogo ||
//             ""
//           );

//           setSavedGoldenBrokerLogo(
//             branding.goldenBrokerageLogo ||
//             ""
//           );

//           console.log(
//             "Branding loaded successfully."
//           );
//         } catch (error) {
//           console.error(
//             "BRANDING LOAD ERROR:",
//             error
//           );
//         }
//       },
//       [
//         user?.email,
//       ]
//     );

//   useEffect(() => {
//     loadBranding();
//   }, [loadBranding]);

//   /* =====================================================
//      PICK PROPERTY IMAGES
//   ===================================================== */

//   const pickImages =
//     async () => {
//       try {
//         const permission =
//           await ImagePicker.requestMediaLibraryPermissionsAsync();

//         if (!permission.granted) {
//           Alert.alert(
//             "Permission Required",
//             "Please allow photo library access to upload images."
//           );

//           return;
//         }

//         const result =
//           await ImagePicker.launchImageLibraryAsync({
//             mediaTypes:
//               ImagePicker.MediaTypeOptions.Images,

//             allowsMultipleSelection:
//               true,

//             quality: 1,
//           });

//         if (result.canceled) {
//           return;
//         }

//         const selected =
//           result.assets.map(
//             (asset, index) => ({
//               uri: asset.uri,

//               name:
//                 asset.fileName ||
//                 `image-${Date.now()}-${index}.jpg`,

//               type:
//                 asset.mimeType ||
//                 "image/jpeg",
//             })
//           );

//         setFiles(
//           previous => [
//             ...previous,
//             ...selected,
//           ]
//         );

//         setGeneratedImages([]);
//       } catch (error) {
//         console.error(
//           "IMAGE PICK ERROR:",
//           error
//         );

//         Alert.alert(
//           "Error",
//           "Unable to select images."
//         );
//       }
//     };

//   /* =====================================================
//      REMOVE IMAGE
//   ===================================================== */

//   const removeImage =
//     (index: number) => {
//       setFiles(
//         previous =>
//           previous.filter(
//             (_, i) =>
//               i !== index
//           )
//       );

//       setGeneratedImages([]);
//     };

//   /* =====================================================
//      BRAND STATUS
//   ===================================================== */

//   const hasBrandSettings =
//     () => {
//       return Boolean(
//         agentName.trim() &&
//         agentPhone.trim() &&
//         savedAgentImage &&
//         savedBrokerLogo &&
//         savedGoldenBrokerLogo
//       );
//     };

//   /* =====================================================
//      PICK BRAND IMAGE
//   ===================================================== */

//   const pickBrandImage =
//     async (
//       type:
//         | "agent"
//         | "broker"
//         | "golden"
//     ) => {
//       try {
//         const permission =
//           await ImagePicker.requestMediaLibraryPermissionsAsync();

//         if (!permission.granted) {
//           Alert.alert(
//             "Permission Required",
//             "Please allow photo library access."
//           );

//           return;
//         }

//         const result =
//           await ImagePicker.launchImageLibraryAsync({
//             mediaTypes:
//               ImagePicker.MediaTypeOptions.Images,

//             allowsEditing:
//               false,

//             quality: 1,
//           });

//         if (result.canceled) {
//           return;
//         }

//         const asset =
//           result.assets[0];

//         if (!asset) {
//           return;
//         }

//         /*
//          * Store the local URI temporarily.
//          * The branding save endpoint accepts
//          * multipart uploads.
//          */

//         if (type === "agent") {
//           setSavedAgentImage(
//             asset.uri
//           );
//         }

//         if (type === "broker") {
//           setSavedBrokerLogo(
//             asset.uri
//           );
//         }

//         if (type === "golden") {
//           setSavedGoldenBrokerLogo(
//             asset.uri
//           );
//         }
//       } catch (error) {
//         console.error(
//           "BRAND IMAGE PICK ERROR:",
//           error
//         );

//         Alert.alert(
//           "Error",
//           "Unable to select image."
//         );
//       }
//     };

//   /* =====================================================
//      SAVE BRANDING
//   ===================================================== */

//   const saveBranding =
//     async () => {
//       try {
//         if (!user?.email) {
//           Alert.alert(
//             "Error",
//             "Admin email not found."
//           );

//           return;
//         }

//         setSavingBranding(true);

//         const formData =
//           new FormData();

//         formData.append(
//           "adminEmail",
//           user.email
//         );

//         formData.append(
//           "agentName",
//           agentName
//         );

//         formData.append(
//           "phone",
//           agentPhone
//         );

//         /*
//          * Only append a URI as a file when
//          * it is a local device URI.
//          */

//         if (
//           savedAgentImage &&
//           savedAgentImage.startsWith(
//             "file://"
//           )
//         ) {
//           formData.append(
//             "agentImage",
//             {
//               uri: savedAgentImage,
//               name: "agent.jpg",
//               type: "image/jpeg",
//             } as any
//           );
//         }

//         if (
//           savedBrokerLogo &&
//           savedBrokerLogo.startsWith(
//             "file://"
//           )
//         ) {
//           formData.append(
//             "brokerageLogo",
//             {
//               uri: savedBrokerLogo,
//               name: "brokerage-logo.jpg",
//               type: "image/jpeg",
//             } as any
//           );
//         }

//         if (
//           savedGoldenBrokerLogo &&
//           savedGoldenBrokerLogo.startsWith(
//             "file://"
//           )
//         ) {
//           formData.append(
//             "goldenBrokerageLogo",
//             {
//               uri:
//                 savedGoldenBrokerLogo,
//               name:
//                 "golden-brokerage-logo.jpg",
//               type: "image/jpeg",
//             } as any
//           );
//         }

//         await axios.post(
//           `${API_URL}/api/design-branding/save`,
//           formData,
//           {
//             headers: {
//               "Content-Type":
//                 "multipart/form-data",
//             },

//             timeout:
//               60000,
//           }
//         );

//         Alert.alert(
//           "Success",
//           "Brand settings saved successfully."
//         );

//         setShowBrandModal(false);

//         /*
//          * Reload from server.
//          *
//          * This is important because if the user
//          * selected a new local image, the server
//          * will return its permanent URL.
//          */

//         await loadBranding();
//       } catch (error) {
//         console.error(
//           "BRANDING SAVE ERROR:",
//           error
//         );

//         let message =
//           "Failed to save brand settings.";

//         if (
//           axios.isAxiosError(error)
//         ) {
//           message =
//             error.response?.data
//               ?.message ||
//             message;
//         }

//         Alert.alert(
//           "Error",
//           message
//         );
//       } finally {
//         setSavingBranding(
//           false
//         );
//       }
//     };

//   /* =====================================================
//      GENERATION READY CALLBACK
//   ===================================================== */

//   const handleCanvasReady =
//     useCallback(() => {
//       setGenerationDone(true);
//     }, []);

//   /* =====================================================
//      CAPTURE CURRENT DESIGN
//   ===================================================== */

//   const captureCurrentDesign =
//     async () => {
//       if (!canvasRef.current) {
//         throw new Error(
//           "Design canvas is not ready."
//         );
//       }

//       const size =
//         getDesignSize(
//           design
//         );

//       const uri =
//         await captureRef(
//           canvasRef.current,
//           {
//             format: "jpg",
//             quality: 0.95,
//             width: size.width,
//             height: size.height,
//             result: "tmpfile",
//           }
//         );

//       return uri;
//     };

//   /* =====================================================
//      GENERATION EFFECT
//   ===================================================== */

//   useEffect(() => {
//     if (
//       generationIndex === null ||
//       !generationDone
//     ) {
//       return;
//     }

//     let cancelled = false;

//     const processImage =
//       async () => {
//         try {
//           /*
//            * Small delay gives React Native time
//            * to finish rendering the final pixels.
//            */

//           await new Promise(
//             resolve =>
//               setTimeout(
//                 resolve,
//                 350
//               )
//           );

//           if (cancelled) {
//             return;
//           }

//           console.log(
//             `🖼 Capturing image ${
//               generationIndex + 1
//             }/${files.length}`
//           );

//           const uri =
//             await captureCurrentDesign();

//           if (cancelled) {
//             return;
//           }

//           setGenerationResults(
//             previous => [
//               ...previous,
//               uri,
//             ]
//           );

//           /*
//            * Continue to next property image.
//            */

//           if (
//             generationIndex + 1 <
//             files.length
//           ) {
//             setGenerationDone(
//               false
//             );

//             setGenerationIndex(
//               generationIndex + 1
//             );
//           } else {
//             /*
//              * All finished.
//              */

//             setGenerationIndex(
//               null
//             );

//             setGenerating(
//               false
//             );

//             const finalResults =
//               [
//                 ...generationResults,
//                 uri,
//               ];

//             setGeneratedImages(
//               finalResults
//             );

//             /*
//              * Ask for media permission and
//              * save every generated image.
//              */

//             try {
//               const permission =
//                 await MediaLibrary.requestPermissionsAsync();

//               if (
//                 permission.granted
//               ) {
//                 for (
//                   const generatedUri of finalResults
//                 ) {
//                   try {
//                     await MediaLibrary.createAssetAsync(
//                       generatedUri
//                     );
//                   } catch (
//                     saveError
//                   ) {
//                     console.error(
//                       "GALLERY SAVE ERROR:",
//                       saveError
//                     );
//                   }
//                 }

//                 Alert.alert(
//                   "Success",
//                   `${finalResults.length} image(s) generated and saved to your gallery.`
//                 );
//               } else {
//                 Alert.alert(
//                   "Generated",
//                   `${finalResults.length} image(s) generated successfully. Gallery permission was not granted.`
//                 );
//               }
//             } catch (
//               galleryError
//             ) {
//               console.error(
//                 "MEDIA LIBRARY ERROR:",
//                 galleryError
//               );

//               Alert.alert(
//                 "Generated",
//                 `${finalResults.length} image(s) generated successfully.`
//               );
//             }
//           }
//         } catch (error) {
//           console.error(
//             "IMAGE CAPTURE ERROR:",
//             error
//           );

//           setGenerating(false);
//           setGenerationIndex(null);

//           Alert.alert(
//             "Generation Failed",
//             error instanceof Error
//               ? error.message
//               : "Failed to generate image."
//           );
//         }
//       };

//     processImage();

//     return () => {
//       cancelled = true;
//     };
//   }, [
//     generationIndex,
//     generationDone,
//   ]);

//   /* =====================================================
//      GENERATE
//   ===================================================== */

//   const handleGenerate =
//     () => {
//       if (!files.length) {
//         Alert.alert(
//           "Images Required",
//           "Please upload at least one image."
//         );

//         return;
//       }

//       if (
//         !hasBrandSettings()
//       ) {
//         Alert.alert(
//           "Brand Settings Required",
//           "Please complete Brand Settings before generating designs.",
//           [
//             {
//               text: "Open Settings",
//               onPress: () =>
//                 setShowBrandModal(
//                   true
//                 ),
//             },
//             {
//               text: "Cancel",
//               style: "cancel",
//             },
//           ]
//         );

//         return;
//       }

//       /*
//        * Choose correct logo.
//        *
//        * Website uses the normal brokerage logo
//        * for social designs and the golden logo
//        * for blog designs.
//        */

//       const logo =
//         design.startsWith("social")
//           ? savedBrokerLogo
//           : savedGoldenBrokerLogo;

//       if (!logo) {
//         Alert.alert(
//           "Logo Required",
//           "The required brokerage logo is missing."
//         );

//         return;
//       }

//       console.log(
//         "===================================="
//       );

//       console.log(
//         "IMAGE GENERATION START"
//       );

//       console.log(
//         "Design:",
//         design
//       );

//       console.log(
//         "Files:",
//         files.length
//       );

//       console.log(
//         "Admin:",
//         user?.email
//       );

//       console.log(
//         "===================================="
//       );

//       setGenerating(true);

//       setGenerationResults([]);

//       setGeneratedImages([]);

//       setGenerationDone(false);

//       setGenerationIndex(0);
//     };

//   /* =====================================================
//      CURRENT DESIGN
//   ===================================================== */

//   const currentDesign =
//     designs.find(
//       item =>
//         item.id === design
//     );

//   /* =====================================================
//      HIDDEN DESIGN CANVAS
//   ===================================================== */

//   const currentProperty =
//     generationIndex !== null &&
//     files[generationIndex]
//       ? files[generationIndex]
//       : null;

//   const currentLogo =
//     design.startsWith("social")
//       ? savedBrokerLogo
//       : savedGoldenBrokerLogo;

//   /* =====================================================
//      UI
//   ===================================================== */

//   return (
//     <View className="flex-1 bg-slate-50">

//       {/* =================================================
//           HIDDEN GENERATION CANVAS
//       ================================================= */}

//       {currentProperty &&
//       currentLogo &&
//       savedAgentImage ? (
//         <DesignCanvas
//           key={`${design}-${generationIndex}-${currentProperty.uri}`}
//           design={design}
//           propertyImage={
//             currentProperty.uri
//           }
//           agentImage={
//             savedAgentImage
//           }
//           logo={currentLogo}
//           agentName={agentName}
//           phone={agentPhone}
//           canvasRef={canvasRef}
//           onReady={
//             handleCanvasReady
//           }
//         />
//       ) : null}

//       {/* =================================================
//           MAIN SCROLL
//       ================================================= */}

//       <ScrollView
//         showsVerticalScrollIndicator={
//           false
//         }
//         contentContainerClassName="p-4 pb-10"
//       >

//         {/* =================================================
//             HEADER
//         ================================================= */}

//         <View className="mb-6">

//           <Text className="text-3xl font-bold text-slate-900">
//             Image Design Studio
//           </Text>

//           <Text className="mt-2 text-sm leading-5 text-slate-500">
//             Upload images, choose a template,
//             and generate professional Realtor designs.
//           </Text>

//         </View>

//         {/* =================================================
//             BRAND SETTINGS
//         ================================================= */}

//         <Pressable
//           onPress={() =>
//             setShowBrandModal(
//               true
//             )
//           }
//           className="mb-5 flex-row items-center justify-center rounded-2xl bg-slate-900 py-4"
//         >

//           <Ionicons
//             name="settings-outline"
//             size={19}
//             color="#FFFFFF"
//           />

//           <Text className="ml-2 font-semibold text-white">
//             Brand Settings
//           </Text>

//         </Pressable>

//         {/* =================================================
//             UPLOAD
//         ================================================= */}

//         <View className="mb-6 rounded-3xl border border-slate-200 bg-white p-4">

//           <SectionHeader
//             title="Upload Images"
//             description="Select one or more property images from your phone."
//             badge={
//               files.length
//                 ? `${files.length} Selected`
//                 : undefined
//             }
//           />

//           <Pressable
//             onPress={
//               pickImages
//             }
//             className="items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-10"
//           >

//             <View className="mb-3 h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">

//               <Ionicons
//                 name="cloud-upload-outline"
//                 size={34}
//                 color="#2563EB"
//               />

//             </View>

//             <Text className="text-lg font-semibold text-slate-900">
//               Upload Images
//             </Text>

//             <Text className="mt-1 text-center text-sm text-slate-500">
//               Tap to browse images from your phone
//             </Text>

//             <Text className="mt-3 text-xs text-slate-400">
//               JPG • PNG • WEBP
//             </Text>

//           </Pressable>

//           {files.length >
//           0 ? (
//             <View className="mt-4 flex-row items-center justify-between rounded-2xl border border-green-200 bg-green-50 p-4">

//               <View>
//                 <Text className="font-semibold text-green-800">
//                   Ready to Generate
//                 </Text>

//                 <Text className="mt-1 text-sm text-green-700">
//                   {files.length} image(s) uploaded
//                 </Text>
//               </View>

//               <View className="rounded-xl bg-green-100 px-3 py-2">

//                 <Text className="text-xs font-bold text-green-700">
//                   READY
//                 </Text>

//               </View>

//             </View>
//           ) : null}

//         </View>

//         {/* =================================================
//             TEMPLATES
//         ================================================= */}

//         <View className="mb-6 rounded-3xl border border-slate-200 bg-white p-4">

//           <SectionHeader
//             title="Select Design Template"
//             description="Choose a design style for all uploaded images."
//             badge={`${designs.length} Templates`}
//           />

//           {designs.map(
//             item => {
//               const selected =
//                 design === item.id;

//               return (
//                 <Pressable
//                   key={item.id}
//                   onPress={() => {
//                     setDesign(
//                       item.id
//                     );

//                     setGeneratedImages(
//                       []
//                     );
//                   }}
//                   className={`mb-4 overflow-hidden rounded-3xl border-2 ${
//                     selected
//                       ? "border-blue-500"
//                       : "border-slate-200"
//                   }`}
//                 >

//                   <View className="h-[390px] items-center justify-center bg-slate-50 p-3">

//                     <Image
//                       source={
//                         item.preview
//                       }
//                       className="h-full w-full"
//                       resizeMode="contain"
//                     />

//                   </View>

//                   <View className="border-t border-slate-100 bg-white p-4">

//                     <View className="flex-row items-start justify-between">

//                       <View className="mr-3 flex-1">

//                         <Text className="text-base font-bold text-slate-900">
//                           {item.title}
//                         </Text>

//                         <Text className="mt-1 text-sm text-slate-500">
//                           {item.size}
//                         </Text>

//                         <Text className="mt-2 text-xs leading-4 text-slate-400">
//                           {item.description}
//                         </Text>

//                       </View>

//                       {selected ? (
//                         <View className="rounded-full bg-blue-600 px-3 py-1.5">

//                           <Text className="text-[10px] font-bold text-white">
//                             SELECTED
//                           </Text>

//                         </View>
//                       ) : null}

//                     </View>

//                   </View>

//                 </Pressable>
//               );
//             }
//           )}

//         </View>

//         {/* =================================================
//             SUMMARY
//         ================================================= */}

//         <View className="mb-6 rounded-3xl border border-slate-200 bg-white p-5">

//           <Text className="text-xl font-bold text-slate-900">
//             Generation Summary
//           </Text>

//           <View className="mt-4">

//             <View className="flex-row items-center justify-between border-b border-slate-100 py-3">

//               <Text className="text-sm text-slate-500">
//                 Template
//               </Text>

//               <Text
//                 numberOfLines={1}
//                 className="ml-4 max-w-[60%] text-right text-sm font-semibold text-slate-900"
//               >
//                 {currentDesign?.title}
//               </Text>

//             </View>

//             <View className="flex-row items-center justify-between border-b border-slate-100 py-3">

//               <Text className="text-sm text-slate-500">
//                 Images
//               </Text>

//               <Text className="text-sm font-semibold text-slate-900">
//                 {files.length}
//               </Text>

//             </View>

//             <View className="flex-row items-center justify-between border-b border-slate-100 py-3">

//               <Text className="text-sm text-slate-500">
//                 Branding
//               </Text>

//               <Text
//                 className={`text-sm font-semibold ${
//                   hasBrandSettings()
//                     ? "text-green-600"
//                     : "text-red-500"
//                 }`}
//               >
//                 {hasBrandSettings()
//                   ? "Configured"
//                   : "Required"}
//               </Text>

//             </View>

//             <View className="flex-row items-center justify-between py-3">

//               <Text className="text-sm text-slate-500">
//                 Status
//               </Text>

//               <Text
//                 className={`text-sm font-semibold ${
//                   files.length &&
//                   hasBrandSettings()
//                     ? "text-green-600"
//                     : "text-slate-400"
//                 }`}
//               >
//                 {files.length &&
//                 hasBrandSettings()
//                   ? "Ready"
//                   : "Waiting"}
//               </Text>

//             </View>

//           </View>

//           {!hasBrandSettings() ? (
//             <View className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">

//               <Text className="text-sm leading-5 text-amber-700">
//                 Complete Brand Settings before generating designs.
//               </Text>

//               <Pressable
//                 onPress={() =>
//                   setShowBrandModal(
//                     true
//                   )
//                 }
//                 className="mt-3 self-start"
//               >

//                 <Text className="text-sm font-semibold text-blue-600">
//                   Open Brand Settings →
//                 </Text>

//               </Pressable>

//             </View>
//           ) : null}

//           {/* GENERATE */}

//           <Pressable
//             onPress={
//               handleGenerate
//             }
//             disabled={
//               generating ||
//               files.length === 0
//             }
//             className={`mt-5 flex-row items-center justify-center rounded-2xl py-4 ${
//               files.length &&
//               !generating
//                 ? "bg-blue-600"
//                 : "bg-slate-300"
//             }`}
//           >

//             {generating ? (
//               <ActivityIndicator
//                 color="#FFFFFF"
//                 size="small"
//               />
//             ) : (
//               <Ionicons
//                 name="sparkles-outline"
//                 size={19}
//                 color="#FFFFFF"
//               />
//             )}

//             <Text className="ml-2 font-semibold text-white">
//               {generating
//                 ? "Generating..."
//                 : "Generate Preview"}
//             </Text>

//           </Pressable>

//         </View>

//         {/* =================================================
//             UPLOADED IMAGES
//         ================================================= */}

//         {files.length >
//         0 ? (
//           <View className="mb-6 rounded-3xl border border-slate-200 bg-white p-4">

//             <View className="mb-4 flex-row items-center justify-between">

//               <Text className="text-xl font-bold text-slate-900">
//                 Uploaded Images
//               </Text>

//               <Text className="text-sm text-slate-500">
//                 {files.length} Files
//               </Text>

//             </View>

//             <View className="flex-row flex-wrap justify-between">

//               {files.map(
//                 (
//                   file,
//                   index
//                 ) => (
//                   <View
//                     key={`${file.uri}-${index}`}
//                     className="mb-4 w-[48%] overflow-hidden rounded-2xl border border-slate-200 bg-white"
//                   >

//                     <View className="h-44 bg-slate-100">

//                       <Image
//                         source={{
//                           uri: file.uri,
//                         }}
//                         className="h-full w-full"
//                         resizeMode="cover"
//                       />

//                     </View>

//                     <View className="p-3">

//                       <Text
//                         numberOfLines={1}
//                         className="text-xs font-medium text-slate-700"
//                       >
//                         {file.name}
//                       </Text>

//                       <Pressable
//                         onPress={() =>
//                           removeImage(
//                             index
//                           )
//                         }
//                         className="mt-2 flex-row items-center"
//                       >

//                         <Ionicons
//                           name="trash-outline"
//                           size={14}
//                           color="#DC2626"
//                         />

//                         <Text className="ml-1 text-xs font-semibold text-red-600">
//                           Remove
//                         </Text>

//                       </Pressable>

//                     </View>

//                   </View>
//                 )
//               )}

//             </View>

//           </View>
//         ) : null}

//         {/* =================================================
//             GENERATED IMAGES
//         ================================================= */}

//         {generatedImages.length >
//         0 ? (
//           <View className="rounded-3xl border border-slate-200 bg-white p-4">

//             <Text className="text-xl font-bold text-slate-900">
//               Generated Designs
//             </Text>

//             <Text className="mt-1 text-sm text-slate-500">
//               Your generated Realtor marketing images.
//             </Text>

//             <View className="mt-5">

//               {generatedImages.map(
//                 (
//                   uri,
//                   index
//                 ) => (
//                   <View
//                     key={`${uri}-${index}`}
//                     className="mb-4 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50"
//                   >

//                     <Image
//                       source={{
//                         uri,
//                       }}
//                       className={
//                         design.includes(
//                           "landscape"
//                         )
//                           ? "h-[300px] w-full"
//                           : "h-[420px] w-full"
//                       }
//                       resizeMode="contain"
//                     />

//                     <View className="border-t border-slate-200 bg-white p-4">

//                       <View className="flex-row items-center justify-between">

//                         <Text className="text-sm font-semibold text-slate-900">
//                           Generated Image{" "}
//                           {index + 1}
//                         </Text>

//                         <View className="rounded-full bg-green-100 px-3 py-1">

//                           <Text className="text-xs font-semibold text-green-700">
//                             SAVED
//                           </Text>

//                         </View>

//                       </View>

//                     </View>

//                   </View>
//                 )
//               )}

//             </View>

//           </View>
//         ) : null}

//       </ScrollView>

//       {/* =====================================================
//           BRAND SETTINGS MODAL
//       ===================================================== */}

//       <Modal
//         visible={
//           showBrandModal
//         }
//         transparent
//         animationType="slide"
//         onRequestClose={() =>
//           setShowBrandModal(
//             false
//           )
//         }
//       >

//         <View className="flex-1 justify-end bg-black/60">

//           <View className="max-h-[92%] rounded-t-[32px] bg-white">

//             {/* HEADER */}

//             <View className="flex-row items-center justify-between border-b border-slate-100 px-5 py-5">

//               <View className="mr-3 flex-1">

//                 <Text className="text-xl font-bold text-slate-900">
//                   Brand Settings
//                 </Text>

//                 <Text className="mt-1 text-sm text-slate-500">
//                   Manage your Realtor branding information
//                 </Text>

//               </View>

//               <Pressable
//                 onPress={() =>
//                   setShowBrandModal(
//                     false
//                   )
//                 }
//                 className="h-10 w-10 items-center justify-center rounded-xl bg-slate-100"
//               >

//                 <Ionicons
//                   name="close"
//                   size={21}
//                   color="#475569"
//                 />

//               </Pressable>

//             </View>

//             <ScrollView
//               showsVerticalScrollIndicator={
//                 false
//               }
//               contentContainerClassName="p-5 pb-10"
//             >

//               {/* AGENT NAME */}

//               <Text className="mb-2 text-sm font-semibold text-slate-800">
//                 Agent Name
//               </Text>

//               <TextInput
//                 value={
//                   agentName
//                 }
//                 onChangeText={
//                   setAgentName
//                 }
//                 placeholder="Enter agent name"
//                 placeholderTextColor="#94A3B8"
//                 className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-900"
//               />

//               {/* PHONE */}

//               <Text className="mb-2 text-sm font-semibold text-slate-800">
//                 Phone
//               </Text>

//               <TextInput
//                 value={
//                   agentPhone
//                 }
//                 onChangeText={
//                   setAgentPhone
//                 }
//                 placeholder="Enter phone number"
//                 placeholderTextColor="#94A3B8"
//                 keyboardType="phone-pad"
//                 className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-900"
//               />

//               {/* AGENT PHOTO */}

//               <Text className="mb-2 text-sm font-semibold text-slate-800">
//                 Agent Photo
//               </Text>

//               {savedAgentImage ? (
//                 <View className="mb-5 overflow-hidden rounded-2xl border border-slate-200">

//                   <Image
//                     source={{
//                       uri:
//                         savedAgentImage,
//                     }}
//                     className="h-52 w-full"
//                     resizeMode="contain"
//                   />

//                   <View className="bg-slate-50 p-3">

//                     <Text className="text-center text-xs text-green-600">
//                       ✓ Agent photo configured
//                     </Text>

//                   </View>

//                   <Pressable
//                     onPress={() =>
//                       pickBrandImage(
//                         "agent"
//                       )
//                     }
//                     className="border-t border-slate-200 bg-white p-3"
//                   >

//                     <Text className="text-center text-sm font-semibold text-blue-600">
//                       Replace Agent Photo
//                     </Text>

//                   </Pressable>

//                 </View>
//               ) : (
//                 <Pressable
//                   onPress={() =>
//                     pickBrandImage(
//                       "agent"
//                     )
//                   }
//                   className="mb-5 items-center rounded-2xl border border-red-200 bg-red-50 p-5"
//                 >

//                   <Ionicons
//                     name="person-outline"
//                     size={28}
//                     color="#DC2626"
//                   />

//                   <Text className="mt-2 text-sm text-red-600">
//                     Agent photo required
//                   </Text>

//                   <Text className="mt-2 text-sm font-semibold text-blue-600">
//                     Select Photo
//                   </Text>

//                 </Pressable>
//               )}

//               {/* WHITE & BLACK LOGO */}

//               <Text className="mb-2 text-sm font-semibold text-slate-800">
//                 White & Black Logo
//               </Text>

//               {savedBrokerLogo ? (
//                 <View className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">

//                   <Image
//                     source={{
//                       uri:
//                         savedBrokerLogo,
//                     }}
//                     className="h-32 w-full"
//                     resizeMode="contain"
//                   />

//                   <View className="bg-white p-3">

//                     <Text className="text-center text-xs text-green-600">
//                       ✓ Logo configured
//                     </Text>

//                   </View>

//                   <Pressable
//                     onPress={() =>
//                       pickBrandImage(
//                         "broker"
//                       )
//                     }
//                     className="border-t border-slate-200 bg-white p-3"
//                   >

//                     <Text className="text-center text-sm font-semibold text-blue-600">
//                       Replace White & Black Logo
//                     </Text>

//                   </Pressable>

//                 </View>
//               ) : (
//                 <Pressable
//                   onPress={() =>
//                     pickBrandImage(
//                       "broker"
//                     )
//                   }
//                   className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4"
//                 >

//                   <Text className="text-sm text-red-600">
//                     White & Black logo required
//                   </Text>

//                   <Text className="mt-2 text-sm font-semibold text-blue-600">
//                     Select Logo
//                   </Text>

//                 </Pressable>
//               )}

//               {/* GOLDEN LOGO */}

//               <Text className="mb-2 text-sm font-semibold text-slate-800">
//                 Golden & Black Logo
//               </Text>

//               {savedGoldenBrokerLogo ? (
//                 <View className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">

//                   <Image
//                     source={{
//                       uri:
//                         savedGoldenBrokerLogo,
//                     }}
//                     className="h-32 w-full"
//                     resizeMode="contain"
//                   />

//                   <View className="bg-white p-3">

//                     <Text className="text-center text-xs text-green-600">
//                       ✓ Golden logo configured
//                     </Text>

//                   </View>

//                   <Pressable
//                     onPress={() =>
//                       pickBrandImage(
//                         "golden"
//                       )
//                     }
//                     className="border-t border-slate-200 bg-white p-3"
//                   >

//                     <Text className="text-center text-sm font-semibold text-blue-600">
//                       Replace Golden & Black Logo
//                     </Text>

//                   </Pressable>

//                 </View>
//               ) : (
//                 <Pressable
//                   onPress={() =>
//                     pickBrandImage(
//                       "golden"
//                     )
//                   }
//                   className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4"
//                 >

//                   <Text className="text-sm text-red-600">
//                     Golden & Black logo required
//                   </Text>

//                   <Text className="mt-2 text-sm font-semibold text-blue-600">
//                     Select Logo
//                   </Text>

//                 </Pressable>
//               )}

//               {/* SAVE */}

//               <Pressable
//                 onPress={
//                   saveBranding
//                 }
//                 disabled={
//                   savingBranding
//                 }
//                 className="flex-row items-center justify-center rounded-2xl bg-slate-900 py-4"
//               >

//                 {savingBranding ? (
//                   <ActivityIndicator
//                     size="small"
//                     color="#FFFFFF"
//                   />
//                 ) : (
//                   <Ionicons
//                     name="save-outline"
//                     size={19}
//                     color="#FFFFFF"
//                   />
//                 )}

//                 <Text className="ml-2 font-semibold text-white">
//                   {savingBranding
//                     ? "Saving..."
//                     : "Save Brand Settings"}
//                 </Text>

//               </Pressable>

//             </ScrollView>

//           </View>

//         </View>

//       </Modal>

//     </View>
//   );
// }