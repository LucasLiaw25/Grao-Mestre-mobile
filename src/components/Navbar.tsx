// src/components/Navbar.tsx
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
// REMOVA: import { useNavigation, useRoute } from "@react-navigation/native";

import { useAuth } from "@/src/hooks/use-auth";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "expo-router"; // Adicionado usePathname
import { Menu, ShoppingBag, User, X } from "lucide-react-native";
import { MotiView, useAnimationState } from "moti";
import { OrderResponseDTO, OrderStatus } from "../types";
import { ordersApi } from "../lib/api";

const cn = (...classNames: (string | boolean | undefined)[]) =>
  classNames.filter(Boolean).join(" ");

const { width } = Dimensions.get("window");

export function Navbar() {
  const router = useRouter();
  // REMOVA: const navigation = useNavigation();
  const pathname = usePathname(); // Use usePathname do expo-router
  const { isAuthenticated, logout, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const mobileMenuAnimationState = useAnimationState({
    closed: {
      opacity: 0,
      height: 0,
    },
    open: {
      opacity: 1,
      height: "auto",
    },
  });

  useEffect(() => {
    // Fecha o menu mobile quando a rota muda
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
      mobileMenuAnimationState.transitionTo("closed");
    }
  }, [pathname]); // Use pathname para detectar mudança de rota

  const { data: pendingOrder } = useQuery<OrderResponseDTO | undefined>({
    queryKey: ["pendingOrder", user?.id],
    queryFn: async () => {
      if (!user?.id) return undefined;
      const response = await ordersApi.filter({
        userId: user.id,
        status: "PENDING" as OrderStatus,
      });
      return response.data?.content?.[0] || undefined;
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 0,
    refetchInterval: 10 * 1000,
    refetchOnWindowFocus: true,
  });

  const cartItemCount =
    pendingOrder?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const navLinks = [
    { to: "/", label: "Home" }, // Use "/" para a rota index
    { to: "/products", label: "Shop Products" }, // Path para app/products.tsx
    { to: "/our-story", label: "Our Story" }, // Path para app/our-story.tsx
  ];

  const headerStyle = {
    backgroundColor: "hsla(30, 25%, 97%, 0.95)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5, // Para Android
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "hsla(30, 15%, 88%, 1)",
  };

  return (
    <>
      <View style={[styles.header, headerStyle]}>
        <View style={styles.container}>
          <View style={styles.contentWrapper}>
            <TouchableOpacity
              onPress={() => router.push("/")} // Use router.push com o path
              style={styles.logoContainer}
            >
              <Text style={styles.logoText}>Grão Mestre.</Text>
            </TouchableOpacity>

            <View style={styles.rightIcons}>
              <TouchableOpacity
                onPress={() => router.push("/orders")} // Use router.push com o path
                style={styles.cartIconContainer}
              >
                <ShoppingBag size={20} color="black" />
                {cartItemCount > 0 && (
                  <MotiView
                    key={cartItemCount}
                    from={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    style={styles.cartBadge}
                  >
                    <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                  </MotiView>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                  mobileMenuAnimationState.transitionTo(
                    isMobileMenuOpen ? "closed" : "open"
                  );
                }}
                style={styles.menuButton}
              >
                {isMobileMenuOpen ? (
                  <X size={24} color="black" />
                ) : (
                  <Menu size={24} color="black" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Menu Mobile */}
      <MotiView
        state={mobileMenuAnimationState}
        transition={{
          type: "timing",
          duration: 300,
        }}
        style={styles.mobileMenu}
      >
        <View style={styles.mobileMenuContent}>
          {navLinks.map((link) => (
            <TouchableOpacity
              key={link.to}
              onPress={() => {
                router.push(link.to);
                setIsMobileMenuOpen(false);
                mobileMenuAnimationState.transitionTo("closed");
              }}
              style={styles.mobileMenuItem}
            >
              <Text style={styles.mobileMenuItemText}>{link.label}</Text>
            </TouchableOpacity>
          ))}
          {isAuthenticated ? (
            <TouchableOpacity
              onPress={() => {
                logout();
                setIsMobileMenuOpen(false);
                mobileMenuAnimationState.transitionTo("closed");
              }}
              style={[styles.mobileMenuItem, styles.logoutButton]}
            >
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => {
                router.push("/login"); // Use router.push com o path
                setIsMobileMenuOpen(false);
                mobileMenuAnimationState.transitionTo("closed");
              }}
              style={[styles.mobileMenuItem, styles.signInButton]}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          )}
          {isAuthenticated && (
            <TouchableOpacity
              onPress={() => {
                router.push("/account"); // Use router.push com o path
                setIsMobileMenuOpen(false);
                mobileMenuAnimationState.transitionTo("closed");
              }}
              style={styles.mobileMenuItem}
            >
              <User size={18} color="black" />
              <Text style={styles.mobileMenuItemText}>Minha Conta</Text>
            </TouchableOpacity>
          )}
        </View>
      </MotiView>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    height: 80, // Altura fixa para o header
    justifyContent: "center",
  },
  container: {
    maxWidth: 768,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 16,
  },
  contentWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: "100%",
  },
  logoContainer: {
    flexShrink: 0,
  },
  logoText: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: -0.5,
    color: "black",
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16, // gap-4
  },
  cartIconContainer: {
    position: "relative",
    padding: 8, // p-2
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF6347",
    borderRadius: 12,
    height: 20,
    width: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cartBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  menuButton: {
    padding: 8,
  },
  mobileMenu: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
    zIndex: 40,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    overflow: "hidden",
  },
  mobileMenuContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 4,
  },
  mobileMenuItem: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mobileMenuItemText: {
    fontSize: 16,
    fontWeight: "500",
    color: "black",
  },
  logoutButton: {
    backgroundColor: "rgba(255, 0, 0, 0.05)",
  },
  logoutButtonText: {
    color: "red", // text-destructive
    fontSize: 16,
    fontWeight: "500",
  },
  signInButton: {
    backgroundColor: "rgba(0, 123, 255, 0.05)",
  },
  signInButtonText: {
    color: "#007BFF",
    fontSize: 16,
    fontWeight: "500",
  },
});