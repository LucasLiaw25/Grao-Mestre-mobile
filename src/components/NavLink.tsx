
import { useAuth } from "@/src/hooks/use-auth";

import { useNavigation, useRoute } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Menu, ShoppingBag, User, X } from "lucide-react-native";
import { MotiView, useAnimationState } from "moti";
import React, { useEffect, useState } from "react";
import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { OrderResponseDTO, OrderStatus } from "../types";
import { ordersApi } from "../lib/api";

export function Navbar() {
  const navigation = useNavigation<any>();
  const route = useRoute();
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
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
      mobileMenuAnimationState.transitionTo("closed");
    }
  }, [route.name]);

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
    { to: "Home", label: "Home" },
    { to: "Products", label: "Shop Products" },
    { to: "About", label: "About Us" },
  ];

  return (
    <>
      <View style={[styles.header, styles.headerFixed]}>
        <View style={styles.container}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation.navigate("Home")}
              style={styles.logoContainer}
            >
              <Text style={styles.logoText}>Grão Mestre.</Text>
            </TouchableOpacity>

            <View style={styles.desktopRight} />

            <View style={styles.mobileRight}>
              <TouchableOpacity
                onPress={() => navigation.navigate("Orders")}
                style={styles.cartButton}
              >
                <ShoppingBag size={20} color="#111827" />
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
                  const next = !isMobileMenuOpen;
                  setIsMobileMenuOpen(next);
                  mobileMenuAnimationState.transitionTo(
                    next ? "open" : "closed"
                  );
                }}
                style={styles.menuButton}
              >
                {isMobileMenuOpen ? (
                  <X size={24} color="#111827" />
                ) : (
                  <Menu size={24} color="#111827" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <MotiView
        state={mobileMenuAnimationState}
        transition={{ type: "timing", duration: 250 }}
        style={styles.mobileMenu}
      >
        <View style={styles.mobileMenuInner}>
          {navLinks.map((link) => (
            <TouchableOpacity
              key={link.to}
              onPress={() => {
                navigation.navigate(link.to);
                setIsMobileMenuOpen(false);
                mobileMenuAnimationState.transitionTo("closed");
              }}
              style={styles.mobileItem}
            >
              <Text style={styles.mobileItemText}>{link.label}</Text>
            </TouchableOpacity>
          ))}
          {isAuthenticated ? (
            <>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate("Account");
                  setIsMobileMenuOpen(false);
                  mobileMenuAnimationState.transitionTo("closed");
                }}
                style={styles.mobileItemRow}
              >
                <User size={18} color="#111827" />
                <Text style={styles.mobileItemText}>Minha Conta</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                  mobileMenuAnimationState.transitionTo("closed");
                }}
                style={styles.mobileSignOut}
              >
                <Text style={styles.mobileSignOutText}>Sign Out</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("Login");
                setIsMobileMenuOpen(false);
                mobileMenuAnimationState.transitionTo("closed");
              }}
              style={styles.mobileSignIn}
            >
              <Text style={styles.mobileSignInText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
      </MotiView>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "hsla(30, 15%, 88%, 1)",
    backgroundColor: "hsla(30, 25%, 97%, 0.95)",
  },
  headerFixed: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  container: {
    maxWidth: 1120,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 16,
  },
  headerContent: {
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoContainer: {
    flexShrink: 0,
  },
  logoText: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: "#111827",
  },
  desktopRight: {
    display: "none",
  },
  mobileRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  cartButton: {
    padding: 8,
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#111827",
    borderRadius: 999,
    height: 20,
    width: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: {
    color: "#F9FAFB",
    fontSize: 10,
    fontWeight: "700",
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
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  mobileMenuInner: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  mobileItem: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  mobileItemText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  mobileItemRow: {
    marginTop: 4,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mobileSignOut: {
    marginTop: 4,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(220, 38, 38, 0.06)",
  },
  mobileSignOutText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#DC2626",
  },
  mobileSignIn: {
    marginTop: 4,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(37, 99, 235, 0.06)",
  },
  mobileSignInText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2563EB",
  },
});