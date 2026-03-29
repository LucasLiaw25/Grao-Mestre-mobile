import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from "react-native";
import { useAuth } from "@/src/hooks/use-auth";
import { useRouter, usePathname, Href } from "expo-router";
import {
  Menu,
  ShoppingBag,
  User,
  X,
  LayoutDashboard,
  Home,
  Coffee,
  BookOpen,
  UserCircle,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "../lib/api";
import { MotiView, AnimatePresence } from "moti";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface NavLinkItem {
  to: Href;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = user?.scopes?.some((s: any) => s.name === "ADMIN");

  // Definição dinâmica dos links de navegação
  const navLinks: NavLinkItem[] = [
    { to: "/" as Href, label: "Home", icon: Home },
    { to: "/products" as Href, label: "Produtos", icon: Coffee },
    { to: "/our-story" as Href, label: "Nossa História", icon: BookOpen },
    ...(isAdmin
      ? [{ to: "/admin/dashboard" as Href, label: "Dashboard", icon: LayoutDashboard }]
      : []),
    ...(isAuthenticated
      ? [{ to: "/account" as Href, label: "Sua Conta", icon: UserCircle }]
      : []),
  ];

  // Busca de pedidos pendentes para o Badge do carrinho
  const { data: pendingOrdersData } = useQuery({
    queryKey: ["pendingOrdersSummary"],
    queryFn: async () => {
      const res = await ordersApi.getMyOrdersByStatus("PENDING" as any);
      return res.data;
    },
    enabled: isAuthenticated,
  });

    const pendingItemsCount = useMemo(() => {
    if (!pendingOrdersData) return 0;

    // Forçamos o TS a entender que pode ser um array ou um objeto com .content
    const data = pendingOrdersData as any; 
    
    const ordersArray = Array.isArray(data)
      ? data
      : data.content || [];

    return ordersArray.reduce((sum: number, order: any) => {
      const itemsSum = (order.items || []).reduce(
        (s: number, it: any) => s + (it.quantity || 0),
        0
      );
      return sum + itemsSum;
    }, 0);
  }, [pendingOrdersData]);

  const navigateTo = (route: Href) => {
    setIsMobileMenuOpen(false);
    router.push(route);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => navigateTo("/")} activeOpacity={0.8}>
          <Text style={styles.logoText}>Grão Mestre</Text>
        </TouchableOpacity>

        <View style={styles.rightActions}>
          {isAuthenticated && (
            <TouchableOpacity
              onPress={() => navigateTo("/orders")}
              style={styles.iconBtn}
              activeOpacity={0.8}
            >
              <ShoppingBag size={24} color="#1c1917" />
              {pendingItemsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {pendingItemsCount > 99 ? "99+" : pendingItemsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => setIsMobileMenuOpen((s) => !s)}
            style={styles.menuBtn}
            activeOpacity={0.8}
          >
            {isMobileMenuOpen ? (
              <X size={28} color="#1c1917" />
            ) : (
              <Menu size={28} color="#1c1917" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Overlay de fundo */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "timing", duration: 120 }}
              style={styles.overlay}
            >
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={1}
                onPress={() => setIsMobileMenuOpen(false)}
              />
            </MotiView>

            {/* Menu Dropdown Animado */}
            <MotiView
              from={{ translateY: -SCREEN_HEIGHT, opacity: 0 }}
              animate={{ translateY: 0, opacity: 1 }}
              exit={{ translateY: -SCREEN_HEIGHT, opacity: 0 }}
              transition={{ type: "spring", damping: 70, stiffness: 160 }}
              style={styles.dropdown}
            >
              <View style={styles.navList}>
                {navLinks.map((link) => {
                  const isActive = pathname === link.to;
                  const Icon = link.icon;
                  return (
                    <TouchableOpacity
                      key={String(link.to)}
                      onPress={() => navigateTo(link.to)}
                      style={[styles.navItem, isActive && styles.activeNavItem]}
                      activeOpacity={0.8}
                    >
                      <View style={styles.linkContent}>
                        <Icon size={22} color={isActive ? "#451a03" : "#44403c"} />
                        <Text
                          style={[styles.navText, isActive && styles.activeNavText]}
                        >
                          {link.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.divider} />

              {!isAuthenticated ? (
                <TouchableOpacity
                  onPress={() => navigateTo("/account")}
                  style={styles.loginBtn}
                  activeOpacity={0.8}
                >
                  <User size={20} color="white" />
                  <Text style={styles.loginBtnText}>Entrar ou Cadastrar</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.userInfo}>
                  <Text style={styles.welcomeText}>
                    Olá, {user?.name?.split(" ")[0]}
                  </Text>
                </View>
              )}
            </MotiView>
          </>
        )}
      </AnimatePresence>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 1000,
    backgroundColor: "#ffffff",
    ...Platform.select({
      ios: { paddingTop: 44 },
      android: { paddingTop: 10 },
    }),
  },
  sidebarContainer: {
  paddingTop: Platform.OS === 'ios' ? 45 : 10, 
},
header: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 20,
  // Reduza o marginBottom de 30 para 15 ou 20
  marginBottom: 15, 
  // Opcional: defina uma altura fixa se quiser controle total
  height: 50, 
},
  container: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
    zIndex: 1005,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f4",
  },
  logoText: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 24,
    fontWeight: "700",
    color: "#1c1917",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    padding: 8,
    position: "relative",
  },
  menuBtn: {
    padding: 8,
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#451a03",
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "900",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(28, 25, 23, 0.4)",
    height: SCREEN_HEIGHT,
    zIndex: 1001,
  },
  dropdown: {
    position: "absolute",
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    zIndex: 1002,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  navList: {
    gap: 4,
  },
  navItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  activeNavItem: {
    backgroundColor: "#fff7ed",
  },
  linkContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  navText: {
    fontSize: 17,
    color: "#44403c",
    fontWeight: "500",
  },
  activeNavText: {
    color: "#451a03",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#f5f5f4",
    marginVertical: 20,
  },
  loginBtn: {
    backgroundColor: "#1c1917",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  loginBtnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  userInfo: {
    alignItems: "center",
    paddingBottom: 10,
  },
  welcomeText: {
    color: "#78716c",
    fontSize: 14,
    fontWeight: "500",
  },
});