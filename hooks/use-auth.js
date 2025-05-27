"use client"

import { useState, useEffect, createContext, useContext } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth"
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { useRouter, usePathname } from "next/navigation"

// Default profile images as base64 strings (we'll use these if no image is provided)
const DEFAULT_PROFILE_IMAGES = [
  "/diverse-woman-portrait.png",
  "/thoughtful-man.png",
  "/woman-with-glasses.png",
  "/bearded-man-portrait.png",
  "/red-haired-woman.png",
  "/thoughtful-asian-man.png",
]

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Initialize auth persistence
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Set persistence to local
        await setPersistence(auth, browserLocalPersistence)
        
        // Get current user
        const currentUser = auth.currentUser
        if (currentUser) {
          setUser(currentUser)
          
          // Fetch user data
          try {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid))
            if (userDoc.exists()) {
              const firestoreUserData = userDoc.data()
              setUserData(firestoreUserData)
              
              // Check admin status
              const isUserAdmin =
                firestoreUserData.role === "admin" ||
                firestoreUserData.isAdmin === true ||
                currentUser.email?.includes("admin") ||
                currentUser.email?.includes("staff")
              setIsAdmin(isUserAdmin)
              
              if (isUserAdmin) {
                sessionStorage.setItem("adminAuth", "true")
              }
            }
          } catch (error) {
            console.error("Error fetching initial user data:", error)
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser)

        try {
          const userDoc = await getDoc(doc(db, "users", authUser.uid))
          if (userDoc.exists()) {
            const firestoreUserData = userDoc.data()
            setUserData(firestoreUserData)
            
            // Check admin status
            const isUserAdmin =
              firestoreUserData.role === "admin" ||
              firestoreUserData.isAdmin === true ||
              authUser.email?.includes("admin") ||
              authUser.email?.includes("staff")
            setIsAdmin(isUserAdmin)
            
            if (isUserAdmin) {
              sessionStorage.setItem("adminAuth", "true")
            }

            // Update online status
            const userRef = doc(db, "users", authUser.uid)
            await updateDoc(userRef, {
              isOnline: true,
              lastSeen: serverTimestamp()
            })

            // Set up online status tracking
            const handleVisibilityChange = async () => {
              if (document.visibilityState === 'visible') {
                await updateDoc(userRef, {
                  isOnline: true,
                  lastSeen: serverTimestamp()
                })
              } else {
                await updateDoc(userRef, {
                  isOnline: false,
                  lastSeen: serverTimestamp()
                })
              }
            }

            // Listen for visibility changes
            document.addEventListener('visibilitychange', handleVisibilityChange)

            // Clean up online status when user logs out
            const cleanup = () => {
              document.removeEventListener('visibilitychange', handleVisibilityChange)
              updateDoc(userRef, {
                isOnline: false,
                lastSeen: serverTimestamp()
              })
            }

            // Add cleanup to window unload
            window.addEventListener('beforeunload', cleanup)

            return () => {
              cleanup()
              window.removeEventListener('beforeunload', cleanup)
            }
          } else {
            setUserData({
              email: authUser.email,
              displayName: authUser.displayName,
              photoURL: authUser.photoURL,
            })
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          setUserData({
            email: authUser.email,
            displayName: authUser.displayName,
            photoURL: authUser.photoURL,
          })
        }
      } else {
        setUser(null)
        setUserData(null)
        setIsAdmin(false)
        sessionStorage.removeItem("adminAuth")
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Handle protected routes
  useEffect(() => {
    if (!loading) {
      // Define public routes that don't require authentication
      const publicRoutes = [
        '/welcome',
        '/login',
        '/register',
        '/forgot-password'
      ]
      
      // Check if current path is a public route
      const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route))
      
      // Only redirect to login if:
      // 1. User is not authenticated AND
      // 2. Current route is not public AND
      // 3. Not already on the login page
      if (!user && !isPublicRoute && pathname !== '/login') {
        router.push('/login')
      }
    }
  }, [loading, user, pathname, router])

  // Helper function to get a default profile image
  const getDefaultProfileImage = (userId) => {
    // Generate a consistent index based on the user's ID
    const userIdSum = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const imageIndex = userIdSum % DEFAULT_PROFILE_IMAGES.length
    return DEFAULT_PROFILE_IMAGES[imageIndex]
  }

  // Register a new user
  const register = async (email, password, userData) => {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Send email verification
      await sendEmailVerification(user)

      // Determine the photoURL to use
      let photoURL = null

      // If user provided a base64 image, use it
      if (userData.photoURL) {
        photoURL = userData.photoURL
        console.log("Using user-provided image (base64)")
      } else if (userData.avatar) {
        photoURL = userData.avatar
        console.log("Using user-provided avatar")
      } else if (userData.useDefaultImage !== false) {
        // Only use a default image if explicitly allowed
        photoURL = getDefaultProfileImage(user.uid)
        console.log("Using default image:", photoURL)
      }

      // Check if this is an admin account
      const isAdminAccount = email.includes("admin") || email.includes("staff") || userData.role === "admin"

      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: email,
        idNumber: userData.idNumber,
        firstName: userData.firstName,
        lastName: userData.lastName,
        hobbies: userData.hobbies || [],
        department: userData.department || "",
        campus: userData.campus || "",
        active: true,
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Store the photoURL (either user-provided or default)
        photoURL: photoURL,
        profileImage: photoURL, // Add an alias for consistency
        // Add admin role if applicable
        role: isAdminAccount ? "admin" : "user",
        isAdmin: isAdminAccount,
      })

      // Try to update profile with name and photo, but don't fail if it doesn't work
      try {
        await updateProfile(user, {
          displayName: `${userData.firstName} ${userData.lastName}`,
          photoURL: photoURL,
        })
      } catch (profileError) {
        console.warn("Could not update profile, but registration will continue:", profileError)
        // Continue with registration even if profile update fails
      }

      return user
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  }

  // Register user profile (for when user is already created)
  const registerUserProfile = async (userData) => {
    try {
      if (!auth.currentUser) {
        throw new Error("No authenticated user found")
      }

      const userId = auth.currentUser.uid

      // Determine the photoURL to use
      let photoURL = null

      // If user provided a base64 image, use it
      if (userData.photoURL) {
        photoURL = userData.photoURL
        console.log("Using user-provided image for profile update (base64)")
      } else if (userData.avatar) {
        photoURL = userData.avatar
        console.log("Using user-provided avatar for profile update")
      } else if (userData.useDefaultImage !== false) {
        // Only use a default image if explicitly allowed
        photoURL = getDefaultProfileImage(userId)
        console.log("Using default image for profile update:", photoURL)
      }

      console.log(
        "Final photoURL being saved to Firestore:",
        photoURL
          ? typeof photoURL === "string" && photoURL.startsWith("data:")
            ? "Base64 image (starts with data:)"
            : photoURL
          : "No image",
      )

      // Check if this is an admin account
      const isAdminAccount =
        auth.currentUser.email?.includes("admin") ||
        auth.currentUser.email?.includes("staff") ||
        userData.role === "admin"

      // Create or update user document in Firestore
      const userDocData = {
        email: auth.currentUser.email,
        idNumber: userData.idNumber,
        firstName: userData.firstName,
        lastName: userData.lastName,
        hobbies: userData.hobbies || [],
        department: userData.department || "",
        campus: userData.campus || "",
        active: true,
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Add admin role if applicable
        role: isAdminAccount ? "admin" : "user",
        isAdmin: isAdminAccount,
      }

      // Add photo URLs if available
      if (photoURL) {
        userDocData.photoURL = photoURL
        userDocData.profileImage = photoURL // Add an alias for consistency
      }

      // Update Firestore document
      await setDoc(doc(db, "users", userId), userDocData, { merge: true })

      // Update local userData state
      setUserData(userDocData)

      // Try to update profile with name and photo, but don't fail if it doesn't work
      try {
        await updateProfile(auth.currentUser, {
          displayName: `${userData.firstName} ${userData.lastName}`,
          ...(photoURL && { photoURL: photoURL }),
        })
      } catch (profileError) {
        console.warn("Could not update profile, but registration will continue:", profileError)
        // Continue with registration even if profile update fails
      }

      return auth.currentUser
    } catch (error) {
      console.error("Error registering user profile:", error)

      // If the error is related to updating the profile, we can still consider
      // the registration successful if the Firestore document was created
      if (error.code === "auth/network-request-failed") {
        console.warn("Network error during profile update, but user data was saved to Firestore")
        return auth.currentUser
      }

      throw error
    }
  }

  // Create admin account
  const createAdminAccount = async (email, password, userData) => {
    try {
      // Create user with regular registration
      const user = await register(email, password, {
        ...userData,
        role: "admin",
      })

      // Update the user document to set admin role
      await updateDoc(doc(db, "users", user.uid), {
        role: "admin",
        isAdmin: true,
        adminCreatedAt: new Date().toISOString(),
      })

      return user
    } catch (error) {
      console.error("Error creating admin account:", error)
      throw error
    }
  }

  // Login user
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)

      try {
        // Update lastActive timestamp - wrapped in try/catch to prevent permissions errors
        const userRef = doc(db, "users", userCredential.user.uid)
        const userDoc = await getDoc(userRef)

        if (userDoc.exists()) {
          const firestoreUserData = userDoc.data()
          setUserData(firestoreUserData)
          console.log("Loaded user data from Firestore on login:", firestoreUserData)

          // Check if user is admin
          const isUserAdmin =
            firestoreUserData.role === "admin" ||
            firestoreUserData.isAdmin === true ||
            email.includes("admin") ||
            email.includes("staff")

          setIsAdmin(isUserAdmin)

          // Store admin status in session storage
          if (isUserAdmin) {
            sessionStorage.setItem("adminAuth", "true")
          }

          // Update user document
          await updateDoc(userRef, {
            lastActive: new Date().toISOString(),
            active: true,
          })
        } else {
          console.log("No user document found in Firestore on login")
          setUserData({
            email: userCredential.user.email,
            displayName: userCredential.user.displayName,
            photoURL: userCredential.user.photoURL,
          })
        }
      } catch (updateError) {
        console.warn("Could not update lastActive timestamp:", updateError)
        // Continue with login even if this fails

        // Fallback to email check for admin status
        const isUserAdmin = email.includes("admin") || email.includes("staff")
        setIsAdmin(isUserAdmin)

        if (isUserAdmin) {
          sessionStorage.setItem("adminAuth", "true")
        }
      }

      return userCredential.user
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  // Login with ID number
  const loginWithIdNumber = async (idNumber, password) => {
    try {
      console.log("Attempting to login with ID:", idNumber)

      // First, try direct email login if the ID looks like an email
      if (idNumber.includes("@")) {
        try {
          console.log("ID looks like an email, trying direct login")
          return await login(idNumber, password)
        } catch (directLoginError) {
          console.error("Direct login failed:", directLoginError)
          // Continue to ID lookup if direct login fails
        }
      }

      // Try to find a user with this ID number in Firestore
      try {
        const usersRef = collection(db, "users")
        const q = query(usersRef, where("idNumber", "==", idNumber))
        const querySnapshot = await getDocs(q)

        console.log("Query results:", querySnapshot.size)

        if (querySnapshot.empty) {
          console.error("No user found with ID:", idNumber)
          throw new Error("No user found with this ID number")
        }

        // Get the first matching user
        const userDoc = querySnapshot.docs[0]
        const firestoreUserData = userDoc.data()

        if (!firestoreUserData.email) {
          throw new Error("User record is missing email address")
        }

        console.log("Found user with email:", firestoreUserData.email)

        // Login with the email associated with this ID number
        const user = await login(firestoreUserData.email, password)

        // Set user data from Firestore
        setUserData(firestoreUserData)

        return user
      } catch (firestoreError) {
        console.error("Firestore query error:", firestoreError)

        // If we get a permissions error, try a different approach
        if (firestoreError.code === "permission-denied") {
          throw new Error("Authentication failed. Please try again with your email address.")
        }

        throw firestoreError
      }
    } catch (error) {
      console.error("ID login error:", error)
      throw error
    }
  }

  // Logout user
  const logout = async () => {
    try {
      // Update lastActive timestamp
      if (auth.currentUser) {
        try {
          const userRef = doc(db, "users", auth.currentUser.uid)
          await updateDoc(userRef, {
            lastActive: new Date().toISOString(),
            active: false,
          })
        } catch (updateError) {
          console.warn("Could not update active status:", updateError)
          // Continue with logout even if this fails
        }
      }

      // Clear admin status
      setIsAdmin(false)
      sessionStorage.removeItem("adminAuth")

      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // Send password reset email
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      throw error
    }
  }

  // Get user profile data
  const getUserProfile = async (userId) => {
    try {
      const docRef = doc(db, "users", userId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const firestoreUserData = docSnap.data()
        console.log("Fetched user profile from Firestore:", firestoreUserData)

        // Update the userData state with the fetched data
        setUserData(firestoreUserData)

        return firestoreUserData
      } else {
        console.log("No user profile found in Firestore")
        throw new Error("User profile not found")
      }
    } catch (error) {
      console.error("Error getting user profile:", error)
      // Return a minimal profile if Firestore access fails
      const minimalProfile = {
        firstName: auth.currentUser?.displayName?.split(" ")[0] || "",
        lastName: auth.currentUser?.displayName?.split(" ")[1] || "",
        email: auth.currentUser?.email || "",
        photoURL: auth.currentUser?.photoURL || null,
        profileImage: auth.currentUser?.photoURL || null,
      }

      // Update the userData state with the minimal profile
      setUserData(minimalProfile)

      return minimalProfile
    }
  }

  // Update user profile
  const updateUserProfile = async (userId, data) => {
    try {
      const userRef = doc(db, "users", userId)

      // Prepare the update data
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString(),
      }

      // Remove fields that shouldn't be updated
      delete updateData.id
      delete updateData.posts
      delete updateData.comments
      delete updateData.createdAt
      delete updateData.email // Email should be updated through a separate process

      console.log("Updating user profile with data:", updateData)

      // Update Firestore document
      await updateDoc(userRef, updateData)

      // Update local userData state
      setUserData((prev) => ({
        ...prev,
        ...updateData,
      }))

      // Try to update auth profile, but don't fail if it doesn't work
      try {
        const updateAuthData = {}

        // Update auth profile if name is provided
        if (data.firstName && data.lastName) {
          updateAuthData.displayName = `${data.firstName} ${data.lastName}`
        }

        // Update profile picture if provided
        if (data.photoURL) {
          updateAuthData.photoURL = data.photoURL
        }

        if (Object.keys(updateAuthData).length > 0) {
          await updateProfile(auth.currentUser, updateAuthData)
        }
      } catch (profileError) {
        console.warn("Could not update auth profile, but Firestore was updated:", profileError)
        // Continue even if profile update fails
      }

      return true
    } catch (error) {
      console.error("Error updating user profile:", error)
      throw error
    }
  }

  const value = {
    user,
    userData,
    loading,
    isAdmin,
    register,
    registerUserProfile,
    createAdminAccount,
    login,
    loginWithIdNumber,
    logout,
    resetPassword,
    getUserProfile,
    updateUserProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  return useContext(AuthContext)
}
