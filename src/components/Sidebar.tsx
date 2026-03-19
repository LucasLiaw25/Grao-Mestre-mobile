// Sidebar.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter, usePathname } from "expo-router"; // Adicionado usePathname
// REMOVA: import { useNavigation, useRoute } from "@react-navigation/native";
import {
  User,
  Tag,
  Coffee,
  LayoutDashboard,
  ShoppingBag,
  BarChart3,
  Menu,
  X,
  Wallet,
} from "lucide-react-native";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = width * 0.75; // 75% da largura da tela para o sidebar

export function Sidebar() {
  const router = useRouter();
  // REMOVA: const navigation = useNavigation();
  const pathname = usePathname(); // Use usePathname do expo-router
  const [isOpen, setIsOpen] = useState(false);

  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      translateX.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
      overlayOpacity.value = withTiming(1, { duration: 300 });
    } else {
      translateX.value = withTiming(-SIDEBAR_WIDTH, {
        duration: 300,
        easing: Easing.in(Easing.ease),
      });
      overlayOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isOpen]);

  useEffect(() => {
    // Fecha o sidebar quando a rota muda
    setIsOpen(false);
  }, [pathname]); // Use pathname para detectar mudança de rota

  const animatedSidebarStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const animatedOverlayStyle = useAnimatedStyle(() => {
    return {
      opacity: overlayOpacity.value,
      pointerEvents: isOpen ? "auto" : "none",
    };
  });

  const navItems = [
    { to: "/admin/dashboard", label: "Dashboard Overview", icon: LayoutDashboard },
    { to: "/admin/users", label: "Users", icon: User },
    { to: "/admin/categories", label: "Categories", icon: Tag },
    { to: "/admin/products", label: "Products", icon: Coffee },
    { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { to: "/admin/reports", label: "Reports", icon: BarChart3 },
    { to: "/admin/expenses", label: "Expense", icon: Wallet },
  ];

  const SidebarContent = () => (
    <View style={styles.sidebarContainer}>
      <View style={styles.header}>
        <TouchableOpacity
            onPress={() => {
            router.push("/login"); // Use router.push com o path
            }}
        >
          {/* Você pode colocar um logo ou texto aqui */}
          <Text style={styles.logoText}>Admin.</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsOpen(false)}
          style={styles.closeButton}
        >
          <X size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.navScroll}>
        <View style={styles.navItemsContainer}>
          {navItems.map((item) => {
            const isActive = pathname === item.to; // Compare com pathname
            return (
              <TouchableOpacity
                key={item.to}
                onPress={() => {
                  router.push(item.to); // Use router.push com o path
                  setIsOpen(false);
                }}
                style={[
                  styles.navItem,
                  isActive ? styles.navItemActive : styles.navItemInactive,
                ]}
              >
                <item.icon
                  size={18}
                  color={isActive ? "#007AFF" : "#6B7280"}
                  style={isActive ? {} : { opacity: 0.6 }}
                />
                <Text
                  style={[
                    styles.navItemText,
                    isActive ? styles.navItemTextActive : {},
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerTitle}>Admin System</Text>
        <Text style={styles.footerText}>
          © {new Date().getFullYear()} Grão Mestre.
        </Text>
        <Text style={styles.footerText}>Curated Excellence.</Text>
      </View>
    </View>
  );

  return (
    <>
      {!isOpen && (
        <TouchableOpacity
          onPress={() => setIsOpen(true)}
          style={styles.menuButton}
        >
          <Menu size={20} color="#333" />
        </TouchableOpacity>
      )}

      <Animated.View
        style={[styles.overlay, animatedOverlayStyle]}
        onTouchStart={() => setIsOpen(false)}
      />

      <Animated.View style={[styles.drawer, animatedSidebarStyle]}>
        <SidebarContent />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    left: 20,
    zIndex: 40,
    padding: 10,
    borderRadius: 4,
    backgroundColor: "#fff",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 60,
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    zIndex: 70,
  },
  sidebarContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  header: {
    marginBottom: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoText: {
    fontFamily: "serif",
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: -0.5,
    color: "#333",
    fontStyle: "italic",
  },
  closeButton: {
    padding: 6,
    borderRadius: 2,
  },
  navScroll: {
    flex: 1,
    marginRight: -8,
    paddingRight: 8,
  },
  navItemsContainer: {
    marginBottom: 10,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 2,
    marginBottom: 6,
  },
  navItemActive: {
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    borderLeftWidth: 2,
    borderLeftColor: "#007AFF",
  },
  navItemInactive: {
    backgroundColor: "transparent",
    borderLeftWidth: 2,
    borderLeftColor: "transparent",
  },
  navItemText: {
    fontSize: 14,
    letterSpacing: 0.2,
    color: "#6B7280",
  },
  navItemTextActive: {
    fontWeight: "600",
    color: "#007AFF",
  },
  footer: {
    marginTop: "auto",
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  footerTitle: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "bold",
    marginBottom: 6,
    color: "rgba(51,51,51,0.7)",
    textTransform: "uppercase",
  },
  footerText: {
    fontFamily: "serif",
    fontStyle: "italic",
    fontSize: 12,
    color: "rgba(107,114,128,0.5)",
  },
});