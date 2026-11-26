import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  useCallback,
  useState,
} from "react";

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  useFocusEffect,
  useRouter,
} from "expo-router";

import axios from "axios";

import {
  useAuth,
} from "../../../contexts/AuthContext";


/* =========================================================
   API
========================================================= */

const API_URL =
  "https://realtorparth.ca";


/* =========================================================
   TYPE
========================================================= */

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  author: string;
  published_at: string;
  tags: string[];
  status: string;
}


/* =========================================================
   BLOG SCREEN
========================================================= */

export default function BlogsScreen() {

  const router = useRouter();

  const {
    user,
    loading: authLoading,
  } = useAuth();


  /* =======================================================
     STATE
  ======================================================= */

  const [posts, setPosts] =
    useState<BlogPost[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] =
    useState("");


  /* =======================================================
     FETCH BLOGS
  ======================================================= */

  const fetchBlogs = useCallback(
    async (
      showLoader = true
    ) => {

      try {

        if (showLoader) {
          setLoading(true);
        }

        const res =
          await axios.get(
            `${API_URL}/api/blogging/blogs`
          );


        const mapped: BlogPost[] =
          res.data.map(
            (b: any) => ({

              id:
                b._id,

              title:
                b.title || "",

              slug:
                b.title
                  ? b.title
                      .toLowerCase()
                      .replace(/\s+/g, "-")
                  : "",

              excerpt:
                b.content?.slice(
                  0,
                  120
                ) || "",

              content:
                b.content || "",

              cover_image:
                b.image
                  ? `${API_URL}/api/blogging/uploads/${b.image}`
                  : b.imageURL || "",

              author:
                b.author || "",

              published_at:
                b.publishDate ||
                b.createdAt ||
                "",

              tags:
                Array.isArray(b.tags)
                  ? b.tags
                  : [],

              status:
                b.status || "draft",

            })
          );


        setPosts(mapped);

      } catch (error) {

        console.error(
          "Failed to fetch blogs:",
          error
        );


        Alert.alert(
          "Error",
          "Failed to load blog posts."
        );

      } finally {

        if (showLoader) {
          setLoading(false);
        }

      }

    },
    []
  );


  /* =======================================================
     AUTH + SCREEN FOCUS
     
     IMPORTANT:
     useFocusEffect runs every time this screen becomes
     active again.

     This fixes:
     New Blog -> Publish -> Blog List
     Edit Blog -> Save -> Blog List
     
     without requiring pull-to-refresh.
  ======================================================= */

  useFocusEffect(
    useCallback(() => {

      if (authLoading) {
        return;
      }


      if (!user) {

        router.replace("/login");

        return;
      }


      /*
       * Fetch every time the screen gets focus.
       *
       * showLoader = true on initial/focus load.
       */
      fetchBlogs(true);

    }, [
      authLoading,
      user,
      router,
      fetchBlogs,
    ])
  );


  /* =======================================================
     PULL TO REFRESH
  ======================================================= */

  const onRefresh =
    useCallback(
      async () => {

        setRefreshing(true);

        try {

          /*
           * Don't show the full-page loader
           * during pull-to-refresh.
           */
          await fetchBlogs(false);

        } finally {

          setRefreshing(false);

        }

      },
      [fetchBlogs]
    );


  /* =======================================================
     DELETE BLOG
  ======================================================= */

  const handleDelete = (
    id: string
  ) => {

    Alert.alert(
      "Delete Blog",

      "Are you sure you want to delete this post?",

      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Delete",

          style: "destructive",

          onPress:
            async () => {

              try {

                await axios.delete(
                  `${API_URL}/api/blogging/blogs/${id}`
                );


                /*
                 * Immediately remove it from
                 * the local list.
                 */
                setPosts(
                  (prev) =>
                    prev.filter(
                      (post) =>
                        post.id !== id
                    )
                );


                Alert.alert(
                  "Success",
                  "Blog post deleted."
                );

              } catch (error) {

                console.error(
                  "Delete failed:",
                  error
                );


                Alert.alert(
                  "Error",
                  "Failed to delete blog post."
                );

              }

            },
        },
      ]
    );
  };


  /* =======================================================
     STATUS TOGGLE
  ======================================================= */

  const handleStatusToggle =
    async (
      id: string,
      currentStatus: string
    ) => {

      const newStatus =
        currentStatus === "published"
          ? "draft"
          : "published";


      try {

        await axios.patch(
          `${API_URL}/api/blogging/blogs/${id}/status`,
          {
            status: newStatus,
          }
        );


        /*
         * Immediately update UI.
         */
        setPosts(
          (prev) =>
            prev.map(
              (post) =>
                post.id === id
                  ? {
                      ...post,
                      status:
                        newStatus,
                    }
                  : post
            )
        );

      } catch (error) {

        console.error(
          "Status update failed:",
          error
        );


        Alert.alert(
          "Error",
          "Failed to update blog status."
        );

      }

    };


  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredPosts =
    posts.filter(
      (post) => {

        const query =
          search
            .trim()
            .toLowerCase();


        if (!query) {
          return true;
        }


        return (
          post.title
            .toLowerCase()
            .includes(query) ||

          post.tags.some(
            (tag) =>
              tag
                .toLowerCase()
                .includes(query)
          )
        );

      }
    );


  /* =======================================================
     STATUS STYLE
  ======================================================= */

  const getStatusStyles =
    (
      status: string
    ) => {

      if (
        status ===
        "published"
      ) {

        return {
          backgroundColor:
            "#dcfce7",

          textColor:
            "#15803d",
        };

      }


      return {
        backgroundColor:
          "#fef3c7",

        textColor:
          "#a16207",
      };

    };


  /* =======================================================
     AUTH LOADING
  ======================================================= */

  if (authLoading) {

    return (
      <View
        className="
          flex-1
          items-center
          justify-center
          bg-gray-100
        "
      >

        <ActivityIndicator
          size="large"
          color="#A8794A"
        />

        <Text
          className="
            mt-3
            text-gray-500
          "
        >
          Checking authentication...
        </Text>

      </View>
    );

  }


  /* =======================================================
     NOT LOGGED IN
  ======================================================= */

  if (!user) {

    return (
      <View
        className="
          flex-1
          items-center
          justify-center
          bg-gray-100
        "
      >

        <ActivityIndicator
          size="large"
          color="#A8794A"
        />

        <Text
          className="
            mt-3
            text-gray-500
          "
        >
          Redirecting to login...
        </Text>

      </View>
    );

  }


  /* =======================================================
     BLOG LOADING
  ======================================================= */

  if (loading) {

    return (
      <View
        className="
          flex-1
          items-center
          justify-center
          bg-gray-100
        "
      >

        <ActivityIndicator
          size="large"
          color="#A8794A"
        />

        <Text
          className="
            mt-3
            text-gray-500
          "
        >
          Loading posts...
        </Text>

      </View>
    );

  }


  /* =======================================================
     UI
  ======================================================= */

  return (

    <ScrollView
      className="
        flex-1
        bg-gray-100
      "

      contentContainerClassName="
        p-5
        pb-10
      "

      refreshControl={
        <RefreshControl
          refreshing={
            refreshing
          }

          onRefresh={
            onRefresh
          }

          tintColor="#A8794A"
        />
      }

      showsVerticalScrollIndicator={
        false
      }
    >

      {/* ===================================================
          HEADER
      =================================================== */}

      <View
        className="
          flex-row
          items-center
          justify-between
        "
      >

        <View
          className="
            flex-1
            pr-3
          "
        >

          <Text
            className="
              text-2xl
              font-bold
              text-gray-900
            "
          >
            Blog Management
          </Text>


          <Text
            className="
              mt-1
              text-gray-500
            "
          >
            Create, edit, and manage your SEO
            articles.
          </Text>

        </View>


        {/* =================================================
            NEW POST
        ================================================= */}

        <Pressable
          onPress={() =>
            router.push(
              "/(admin)/blogs/new"
            )
          }

          className="
            flex-row
            items-center
            rounded-xl
            bg-bronze
            px-4
            py-3
          "

          android_ripple={{
            color:
              "#8f663e",
          }}
        >

          <Ionicons
            name="add"
            size={20}
            color="#ffffff"
          />

          <Text
            className="
              ml-1
              font-bold
              text-white
            "
          >
            New
          </Text>

        </Pressable>

      </View>


      {/* ===================================================
          SEARCH
      =================================================== */}

      <View
        className="
          mt-5
          flex-row
          items-center
          rounded-xl
          border
          border-gray-200
          bg-white
          px-4
        "
      >

        <Ionicons
          name="search-outline"
          size={20}
          color="#9ca3af"
        />


        <TextInput
          value={
            search
          }

          onChangeText={
            setSearch
          }

          placeholder="Search posts..."

          placeholderTextColor="#9ca3af"

          autoCapitalize="none"

          autoCorrect={
            false
          }

          className="
            ml-3
            flex-1
            py-3
            text-gray-900
          "
        />


        {search.length > 0 && (

          <Pressable
            onPress={() =>
              setSearch("")
            }
          >

            <Ionicons
              name="close-circle"
              size={20}
              color="#9ca3af"
            />

          </Pressable>

        )}

      </View>


      {/* ===================================================
          RESULT COUNT
      =================================================== */}

      <View
        className="mt-4"
      >

        <Text
          className="
            text-sm
            text-gray-500
          "
        >
          {filteredPosts.length}{" "}
          {
            filteredPosts.length ===
            1
              ? "post"
              : "posts"
          }
        </Text>

      </View>


      {/* ===================================================
          POSTS
      =================================================== */}

      <View
        className="mt-3"
      >

        {filteredPosts.map(
          (post) => {

            const status =
              getStatusStyles(
                post.status
              );


            return (

              <View
                key={
                  post.id
                }

                className="
                  mb-4
                  rounded-2xl
                  border
                  border-gray-100
                  bg-white
                  p-4
                "
              >

                {/* =========================================
                    TOP SECTION
                ========================================= */}

                <View
                  className="
                    flex-row
                  "
                >

                  {/* IMAGE */}

                  {post.cover_image ? (

                    <Image
                      source={{
                        uri:
                          post.cover_image,
                      }}

                      className="
                        h-20
                        w-20
                        rounded-xl
                        bg-gray-100
                      "

                      resizeMode="cover"
                    />

                  ) : (

                    <View
                      className="
                        h-20
                        w-20
                        items-center
                        justify-center
                        rounded-xl
                        bg-gray-100
                      "
                    >

                      <Ionicons
                        name="image-outline"
                        size={28}
                        color="#9ca3af"
                      />

                    </View>

                  )}


                  {/* CONTENT */}

                  <View
                    className="
                      ml-4
                      flex-1
                    "
                  >

                    <Text
                      numberOfLines={2}

                      className="
                        font-bold
                        text-gray-900
                      "
                    >
                      {
                        post.title
                      }
                    </Text>


                    {/* TAGS */}

                    <View
                      className="
                        mt-2
                        flex-row
                        flex-wrap
                      "
                    >

                      {post.tags.length >
                      0 ? (

                        post.tags.map(
                          (
                            tag,
                            index
                          ) => (

                            <View
                              key={
                                `${tag}-${index}`
                              }

                              className="
                                mb-1
                                mr-1
                                rounded-full
                                bg-gray-100
                                px-2
                                py-1
                              "
                            >

                              <Text
                                className="
                                  text-xs
                                  text-gray-600
                                "
                              >
                                {
                                  tag
                                }
                              </Text>

                            </View>

                          )
                        )

                      ) : (

                        <Text
                          className="
                            text-xs
                            text-gray-400
                          "
                        >
                          No tags
                        </Text>

                      )}

                    </View>

                  </View>

                </View>


                {/* =========================================
                    STATUS / DATE
                ========================================= */}

                <View
                  className="
                    mt-4
                    flex-row
                    items-center
                    justify-between
                  "
                >

                  {/* STATUS */}

                  <View
                    style={{
                      backgroundColor:
                        status.backgroundColor,
                    }}

                    className="
                      rounded-full
                      px-3
                      py-1
                    "
                  >

                    <Text
                      style={{
                        color:
                          status.textColor,
                      }}

                      className="
                        text-xs
                        font-bold
                        uppercase
                      "
                    >
                      {
                        post.status
                      }
                    </Text>

                  </View>


                  {/* SWITCH */}

                  <Pressable
                    onPress={() =>
                      handleStatusToggle(
                        post.id,
                        post.status
                      )
                    }

                    className={`
                      h-6
                      w-11
                      rounded-full
                      p-1
                      ${
                        post.status ===
                        "published"
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }
                    `}
                  >

                    <View
                      className={`
                        h-4
                        w-4
                        rounded-full
                        bg-white
                        ${
                          post.status ===
                          "published"
                            ? "ml-5"
                            : "ml-0"
                        }
                      `}
                    />

                  </Pressable>


                  {/* DATE */}

                  <Text
                    className="
                      text-xs
                      text-gray-500
                    "
                  >
                    {
                      post.published_at
                    }
                  </Text>

                </View>


                {/* =========================================
                    ACTIONS
                ========================================= */}

                <View
                  className="
                    mt-4
                    flex-row
                    justify-end
                    border-t
                    border-gray-100
                    pt-3
                  "
                >

                  {/* EDIT */}

                  <Pressable
                    onPress={() =>
                      router.push(
                        `/(admin)/blogs/${post.id}`
                      )
                    }

                    className="
                      mr-3
                      rounded-lg
                      bg-blue-50
                      p-3
                    "
                  >

                    <Ionicons
                      name="create-outline"
                      size={19}
                      color="#2563eb"
                    />

                  </Pressable>


                  {/* DELETE */}

                  <Pressable
                    onPress={() =>
                      handleDelete(
                        post.id
                      )
                    }

                    className="
                      rounded-lg
                      bg-red-50
                      p-3
                    "
                  >

                    <Ionicons
                      name="trash-outline"
                      size={19}
                      color="#dc2626"
                    />

                  </Pressable>

                </View>

              </View>

            );

          }
        )}


        {/* =================================================
            EMPTY
        ================================================= */}

        {filteredPosts.length ===
          0 && (

            <View
              className="
                items-center
                rounded-2xl
                bg-white
                p-10
              "
            >

              <Ionicons
                name="document-text-outline"
                size={40}
                color="#9ca3af"
              />


              <Text
                className="
                  mt-3
                  text-gray-400
                "
              >
                {
                  search
                    ? "No posts match your search."
                    : "No posts found."
                }
              </Text>

            </View>

          )}

      </View>

    </ScrollView>

  );
}






































// import {
//   ActivityIndicator,
//   Alert,
//   Image,
//   Pressable,
//   RefreshControl,
//   ScrollView,
//   Text,
//   TextInput,
//   View,
// } from "react-native";

// import {
//   useCallback,
//   useEffect,
//   useState,
// } from "react";

// import { Ionicons } from "@expo/vector-icons";

// import { useRouter } from "expo-router";

// import axios from "axios";

// import { useAuth } from "../../../contexts/AuthContext";


// /* =========================================================
//    API
// ========================================================= */

// const API_URL = "https://realtorparth.ca";


// /* =========================================================
//    TYPE
// ========================================================= */

// interface BlogPost {
//   id: string;
//   title: string;
//   slug: string;
//   excerpt: string;
//   content: string;
//   cover_image: string;
//   author: string;
//   published_at: string;
//   tags: string[];
//   status: string;
// }


// /* =========================================================
//    BLOG SCREEN
// ========================================================= */

// export default function BlogsScreen() {
//   const router = useRouter();

//   const {
//     user,
//     loading: authLoading,
//   } = useAuth();


//   /* =======================================================
//      STATE
//   ======================================================= */

//   const [posts, setPosts] =
//     useState<BlogPost[]>([]);

//   const [loading, setLoading] =
//     useState(true);

//   const [refreshing, setRefreshing] =
//     useState(false);

//   const [search, setSearch] =
//     useState("");


//   /* =======================================================
//      FETCH BLOGS
//   ======================================================= */

//   const fetchBlogs = async () => {
//     try {
//       setLoading(true);

//       const res = await axios.get(
//         `${API_URL}/api/blogging/blogs`
//       );

//       const mapped: BlogPost[] =
//         res.data.map((b: any) => ({
//           id: b._id,

//           title: b.title || "",

//           slug: b.title
//             ? b.title
//                 .toLowerCase()
//                 .replace(/\s+/g, "-")
//             : "",

//           excerpt:
//             b.content?.slice(0, 120) || "",

//           content:
//             b.content || "",

//           cover_image: b.image
//             ? `${API_URL}/api/blogging/uploads/${b.image}`
//             : b.imageURL || "",

//           author:
//             b.author || "",

//           published_at:
//             b.publishDate ||
//             b.createdAt ||
//             "",

//           tags:
//             Array.isArray(b.tags)
//               ? b.tags
//               : [],

//           status:
//             b.status || "draft",
//         }));

//       setPosts(mapped);
//     } catch (error) {
//       console.error(
//         "Failed to fetch blogs:",
//         error
//       );

//       Alert.alert(
//         "Error",
//         "Failed to load blog posts."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };


//   /* =======================================================
//      AUTH CHECK + INITIAL LOAD
//   ======================================================= */

//   useEffect(() => {
//     if (authLoading) {
//       return;
//     }

//     if (!user) {
//       router.replace("/login");
//       return;
//     }

//     fetchBlogs();
//   }, [
//     authLoading,
//     user,
//     router,
//   ]);


//   /* =======================================================
//      PULL TO REFRESH
//   ======================================================= */

//   const onRefresh = useCallback(
//     async () => {
//       setRefreshing(true);

//       await fetchBlogs();

//       setRefreshing(false);
//     },
//     []
//   );


//   /* =======================================================
//      DELETE BLOG
//   ======================================================= */

//   const handleDelete = (
//     id: string
//   ) => {
//     Alert.alert(
//       "Delete Blog",
//       "Are you sure you want to delete this post?",
//       [
//         {
//           text: "Cancel",
//           style: "cancel",
//         },

//         {
//           text: "Delete",
//           style: "destructive",

//           onPress: async () => {
//             try {
//               await axios.delete(
//                 `${API_URL}/api/blogging/blogs/${id}`
//               );

//               setPosts((prev) =>
//                 prev.filter(
//                   (post) =>
//                     post.id !== id
//                 )
//               );

//               Alert.alert(
//                 "Success",
//                 "Blog post deleted."
//               );
//             } catch (error) {
//               console.error(
//                 "Delete failed:",
//                 error
//               );

//               Alert.alert(
//                 "Error",
//                 "Failed to delete blog post."
//               );
//             }
//           },
//         },
//       ]
//     );
//   };


//   /* =======================================================
//      STATUS TOGGLE
//   ======================================================= */

//   const handleStatusToggle =
//     async (
//       id: string,
//       currentStatus: string
//     ) => {
//       const newStatus =
//         currentStatus === "published"
//           ? "draft"
//           : "published";

//       try {
//         await axios.patch(
//           `${API_URL}/api/blogging/blogs/${id}/status`,
//           {
//             status: newStatus,
//           }
//         );

//         setPosts((prev) =>
//           prev.map((post) =>
//             post.id === id
//               ? {
//                   ...post,
//                   status: newStatus,
//                 }
//               : post
//           )
//         );
//       } catch (error) {
//         console.error(
//           "Status update failed:",
//           error
//         );

//         Alert.alert(
//           "Error",
//           "Failed to update blog status."
//         );
//       }
//     };


//   /* =======================================================
//      SEARCH
//   ======================================================= */

//   const filteredPosts =
//     posts.filter((post) => {
//       const query =
//         search.trim().toLowerCase();

//       if (!query) {
//         return true;
//       }

//       return (
//         post.title
//           .toLowerCase()
//           .includes(query) ||
//         post.tags.some((tag) =>
//           tag
//             .toLowerCase()
//             .includes(query)
//         )
//       );
//     });


//   /* =======================================================
//      STATUS STYLE
//   ======================================================= */

//   const getStatusStyles = (
//     status: string
//   ) => {
//     if (status === "published") {
//       return {
//         backgroundColor: "#dcfce7",
//         textColor: "#15803d",
//       };
//     }

//     return {
//       backgroundColor: "#fef3c7",
//       textColor: "#a16207",
//     };
//   };


//   /* =======================================================
//      AUTH LOADING
//   ======================================================= */

//   if (authLoading) {
//     return (
//       <View className="flex-1 items-center justify-center bg-gray-100">

//         <ActivityIndicator
//           size="large"
//           color="#A8794A"
//         />

//         <Text className="mt-3 text-gray-500">
//           Checking authentication...
//         </Text>

//       </View>
//     );
//   }


//   /* =======================================================
//      NOT LOGGED IN
//   ======================================================= */

//   if (!user) {
//     return (
//       <View className="flex-1 items-center justify-center bg-gray-100">

//         <ActivityIndicator
//           size="large"
//           color="#A8794A"
//         />

//         <Text className="mt-3 text-gray-500">
//           Redirecting to login...
//         </Text>

//       </View>
//     );
//   }


//   /* =======================================================
//      BLOG LOADING
//   ======================================================= */

//   if (loading) {
//     return (
//       <View className="flex-1 items-center justify-center bg-gray-100">

//         <ActivityIndicator
//           size="large"
//           color="#A8794A"
//         />

//         <Text className="mt-3 text-gray-500">
//           Loading posts...
//         </Text>

//       </View>
//     );
//   }


//   /* =======================================================
//      UI
//   ======================================================= */

//   return (
//     <ScrollView
//       className="flex-1 bg-gray-100"

//       contentContainerClassName="
//         p-5
//         pb-10
//       "

//       refreshControl={
//         <RefreshControl
//           refreshing={refreshing}
//           onRefresh={onRefresh}
//           tintColor="#A8794A"
//         />
//       }

//       showsVerticalScrollIndicator={false}
//     >

//       {/* ===================================================
//           HEADER
//       =================================================== */}

//       <View className="flex-row items-center justify-between">

//         <View className="flex-1 pr-3">

//           <Text className="text-2xl font-bold text-gray-900">
//             Blog Management
//           </Text>

//           <Text className="mt-1 text-gray-500">
//             Create, edit, and manage your SEO
//             articles.
//           </Text>

//         </View>


//         {/* NEW POST */}

//         <Pressable
//           onPress={() =>
//             router.push(
//               "/(admin)/blogs/new"
//             )
//           }

//           className="
//             flex-row
//             items-center
//             rounded-xl
//             bg-bronze
//             px-4
//             py-3
//           "

//           android_ripple={{
//             color: "#8f663e",
//           }}
//         >

//           <Ionicons
//             name="add"
//             size={20}
//             color="#ffffff"
//           />

//           <Text className="ml-1 font-bold text-white">
//             New
//           </Text>

//         </Pressable>

//       </View>


//       {/* ===================================================
//           SEARCH
//       =================================================== */}

//       <View
//         className="
//           mt-5
//           flex-row
//           items-center
//           rounded-xl
//           border
//           border-gray-200
//           bg-white
//           px-4
//         "
//       >

//         <Ionicons
//           name="search-outline"
//           size={20}
//           color="#9ca3af"
//         />

//         <TextInput
//           value={search}
//           onChangeText={setSearch}
//           placeholder="Search posts..."
//           placeholderTextColor="#9ca3af"
//           autoCapitalize="none"
//           autoCorrect={false}
//           className="
//             ml-3
//             flex-1
//             py-3
//             text-gray-900
//           "
//         />

//         {search.length > 0 && (
//           <Pressable
//             onPress={() => setSearch("")}
//           >
//             <Ionicons
//               name="close-circle"
//               size={20}
//               color="#9ca3af"
//             />
//           </Pressable>
//         )}

//       </View>


//       {/* ===================================================
//           RESULT COUNT
//       =================================================== */}

//       <View className="mt-4">

//         <Text className="text-sm text-gray-500">
//           {filteredPosts.length}{" "}
//           {filteredPosts.length === 1
//             ? "post"
//             : "posts"}
//         </Text>

//       </View>


//       {/* ===================================================
//           POSTS
//       =================================================== */}

//       <View className="mt-3">

//         {filteredPosts.map(
//           (post) => {

//             const status =
//               getStatusStyles(
//                 post.status
//               );

//             return (
//               <View
//                 key={post.id}

//                 className="
//                   mb-4
//                   rounded-2xl
//                   border
//                   border-gray-100
//                   bg-white
//                   p-4
//                 "
//               >

//                 {/* =========================================
//                     TOP SECTION
//                 ========================================= */}

//                 <View className="flex-row">

//                   {/* IMAGE */}

//                   {post.cover_image ? (
//                     <Image
//                       source={{
//                         uri:
//                           post.cover_image,
//                       }}

//                       className="
//                         h-20
//                         w-20
//                         rounded-xl
//                         bg-gray-100
//                       "

//                       resizeMode="cover"
//                     />
//                   ) : (
//                     <View
//                       className="
//                         h-20
//                         w-20
//                         items-center
//                         justify-center
//                         rounded-xl
//                         bg-gray-100
//                       "
//                     >

//                       <Ionicons
//                         name="image-outline"
//                         size={28}
//                         color="#9ca3af"
//                       />

//                     </View>
//                   )}


//                   {/* CONTENT */}

//                   <View className="ml-4 flex-1">

//                     <Text
//                       numberOfLines={2}
//                       className="
//                         font-bold
//                         text-gray-900
//                       "
//                     >
//                       {post.title}
//                     </Text>


//                     {/* TAGS */}

//                     <View
//                       className="
//                         mt-2
//                         flex-row
//                         flex-wrap
//                       "
//                     >

//                       {post.tags.length >
//                       0 ? (
//                         post.tags.map(
//                           (
//                             tag,
//                             index
//                           ) => (
//                             <View
//                               key={`${tag}-${index}`}
//                               className="
//                                 mb-1
//                                 mr-1
//                                 rounded-full
//                                 bg-gray-100
//                                 px-2
//                                 py-1
//                               "
//                             >

//                               <Text className="text-xs text-gray-600">
//                                 {tag}
//                               </Text>

//                             </View>
//                           )
//                         )
//                       ) : (
//                         <Text className="text-xs text-gray-400">
//                           No tags
//                         </Text>
//                       )}

//                     </View>

//                   </View>

//                 </View>


//                 {/* =========================================
//                     STATUS / DATE
//                 ========================================= */}

//                 <View
//                   className="
//                     mt-4
//                     flex-row
//                     items-center
//                     justify-between
//                   "
//                 >

//                   {/* STATUS */}

//                   <View
//                     style={{
//                       backgroundColor:
//                         status.backgroundColor,
//                     }}

//                     className="
//                       rounded-full
//                       px-3
//                       py-1
//                     "
//                   >

//                     <Text
//                       style={{
//                         color:
//                           status.textColor,
//                       }}

//                       className="
//                         text-xs
//                         font-bold
//                         uppercase
//                       "
//                     >
//                       {post.status}
//                     </Text>

//                   </View>


//                   {/* SWITCH */}

//                   <Pressable
//                     onPress={() =>
//                       handleStatusToggle(
//                         post.id,
//                         post.status
//                       )
//                     }

//                     className={`
//                       h-6
//                       w-11
//                       rounded-full
//                       p-1
//                       ${
//                         post.status ===
//                         "published"
//                           ? "bg-green-500"
//                           : "bg-gray-300"
//                       }
//                     `}
//                   >

//                     <View
//                       className={`
//                         h-4
//                         w-4
//                         rounded-full
//                         bg-white
//                         ${
//                           post.status ===
//                           "published"
//                             ? "ml-5"
//                             : "ml-0"
//                         }
//                       `}
//                     />

//                   </Pressable>


//                   {/* DATE */}

//                   <Text className="text-xs text-gray-500">
//                     {post.published_at}
//                   </Text>

//                 </View>


//                 {/* =========================================
//                     ACTIONS
//                 ========================================= */}

//                 <View
//                   className="
//                     mt-4
//                     flex-row
//                     justify-end
//                     border-t
//                     border-gray-100
//                     pt-3
//                   "
//                 >

//                   {/* EDIT */}

//                   <Pressable
//                     onPress={() =>
//                       router.push(
//                         `/(admin)/blogs/${post.id}`
//                       )
//                     }

//                     className="
//                       mr-3
//                       rounded-lg
//                       bg-blue-50
//                       p-3
//                     "
//                   >

//                     <Ionicons
//                       name="create-outline"
//                       size={19}
//                       color="#2563eb"
//                     />

//                   </Pressable>


//                   {/* DELETE */}

//                   <Pressable
//                     onPress={() =>
//                       handleDelete(
//                         post.id
//                       )
//                     }

//                     className="
//                       rounded-lg
//                       bg-red-50
//                       p-3
//                     "
//                   >

//                     <Ionicons
//                       name="trash-outline"
//                       size={19}
//                       color="#dc2626"
//                     />

//                   </Pressable>

//                 </View>

//               </View>
//             );
//           }
//         )}


//         {/* =================================================
//             EMPTY
//         ================================================= */}

//         {filteredPosts.length ===
//           0 && (
//             <View
//               className="
//                 items-center
//                 rounded-2xl
//                 bg-white
//                 p-10
//               "
//             >

//               <Ionicons
//                 name="document-text-outline"
//                 size={40}
//                 color="#9ca3af"
//               />

//               <Text className="mt-3 text-gray-400">
//                 {search
//                   ? "No posts match your search."
//                   : "No posts found."}
//               </Text>

//             </View>
//           )}

//       </View>

//     </ScrollView>
//   );
// }