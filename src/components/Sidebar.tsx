import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
  Pressable,
} from "react-native";
import { useRouter, usePathname, Href } from "expo-router";
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
  LogOut,
} from "lucide-react-native";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";
import { useAuth } from "@/src/hooks/use-auth";

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = width * 0.75;

// Interface para garantir que os links sejam rotas válidas
interface NavItem {
  to: Href;
  label: string;
  icon: React.ElementType;
}

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const overlayOpacity = useSharedValue(0);

  const navItems = [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/users", label: "Usuários", icon: User },
    { to: "/admin/categories", label: "Categorias", icon: Tag },
    { to: "/admin/products", label: "Produtos", icon: Coffee },
    { to: "/admin/orders", label: "Pedidos", icon: ShoppingBag },
    { to: "/admin/reports", label: "Relatórios", icon: BarChart3 },
    { to: "/admin/expenses", label: "Despesas", icon: Wallet },
  ] as const;

  const toggleSidebar = (open: boolean) => {
    setIsOpen(open);
    translateX.value = withTiming(open ? 0 : -SIDEBAR_WIDTH, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    overlayOpacity.value = withTiming(open ? 1 : 0, { duration: 300 });
  };

  const navigateTo = (dest: Href) => {
    toggleSidebar(false);
    router.push(dest);
  };

  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    display: overlayOpacity.value === 0 && !isOpen ? 'none' : 'flex',
  }));

  return (
    <>

      <TouchableOpacity 
        style={styles.triggerBtn} 
        onPress={() => toggleSidebar(true)}
      >
        <Menu size={28} color="#1c1917" />
      </TouchableOpacity>

      {/* Overlay de fundo */}
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={styles.pressableOverlay} onPress={() => toggleSidebar(false)} />
      </Animated.View>

      {/* Container da Sidebar */}
      <Animated.View style={[styles.sidebarContainer, sidebarStyle]}>
        <View style={styles.header}>
          <Text style={styles.logoText}>Grão Mestre</Text>
          <TouchableOpacity onPress={() => toggleSidebar(false)} style={styles.closeBtn}>
            <X size={24} color="#44403c" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.navItemsContainer}>
            {navItems.map((item) => {
              const isActive = pathname === item.to;
              return (
                <TouchableOpacity
                  key={item.to}
                  onPress={() => navigateTo(item.to)}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                >
                  <item.icon 
                    size={22} 
                    color={isActive ? "#1c1917" : "#78716c"} 
                  />
                  <Text style={[styles.navItemText, isActive && styles.navItemTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  triggerBtn: {
    padding: 16,
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 10,
    left: 10,
    zIndex: 90,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 100,
  },
  pressableOverlay: { flex: 1 },
  sidebarContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#ffffff",
    zIndex: 101,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  logoText: {
    fontFamily: "serif",
    fontSize: 22,
    fontWeight: "bold",
    color: "#1c1917",
  },
  closeBtn: { padding: 4 },
  navScroll: { flex: 1 },
  navItemsContainer: { paddingHorizontal: 12 },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: "#f5f5f4",
  },
  navItemText: {
    fontSize: 15,
    color: "#78716c",
    fontWeight: "500",
  },
  navItemTextActive: {
    color: "#1c1917",
    fontWeight: "bold",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e7e5e4",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  logoutText: {
    color: "#ef4444",
    fontWeight: "bold",
    fontSize: 15,
  },
});