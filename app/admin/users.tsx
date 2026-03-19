import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Home,
  KeyRound,
  Search,
  Users,
  ShieldCheck,
  UserPlus,
  UserCog,
  Key,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Mail,
  Star,
} from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Animated, {
  Layout,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"; // Assumindo que você tem um componente de Dialog adaptado para RN
import { Switch } from "@/components/ui/switch"; // Assumindo que você tem um componente de Switch adaptado para RN
import { useToast } from "@/hooks/use-toast"; // Assumindo que você tem um hook de toast adaptado para RN
import { usersApi, scopesApi, addressesApi } from "@/lib/api";
import type {
  UserRequestDTO,
  UserResponseDTO,
  ScopeResponseDTO,
  AddressRequestDTO,
  AddressResponseDTO,
} from "@/types";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type ScopeFilter = "ALL" | string;

const STATUS_FILTER_CONFIG: {
  value: StatusFilter;
  label: string;
  activeClass: string;
  icon: React.ReactNode;
  badgeClass: string;
}[] = [
  {
    value: "ALL",
    label: "Todos",
    activeClass: "bg-stone-800 text-amber-50 border-stone-800",
    icon: <Users size={14} color="#a8a29e" />,
    badgeClass: "bg-stone-200 text-stone-700",
  },
  {
    value: "ACTIVE",
    label: "Ativos",
    activeClass: "bg-emerald-700 text-emerald-50 border-emerald-700",
    icon: <CheckCircle size={14} color="#10b981" />,
    badgeClass: "bg-emerald-100 text-emerald-800",
  },
  {
    value: "INACTIVE",
    label: "Inativos",
    activeClass: "bg-red-800 text-red-50 border-red-800",
    icon: <XCircle size={14} color="#ef4444" />,
    badgeClass: "bg-red-100 text-red-800",
  },
];

const getScopeBadgeClass = (scopeName: string) => {
  const name = scopeName.replace("SCOPE_", "").toUpperCase();
  if (name === "ADMIN")
    return "bg-indigo-50 text-indigo-700 border border-indigo-100";
  if (name === "MANAGER")
    return "bg-blue-50 text-blue-700 border border-blue-100";
  if (name === "DRIVER")
    return "bg-teal-50 text-teal-700 border border-teal-100";
  if (name === "USER")
    return "bg-stone-50 text-stone-700 border border-stone-200";
  return "bg-amber-50 text-amber-700 border border-amber-100";
};

const getAvatarClass = (name: string) => {
  const colors = [
    "bg-indigo-100 text-indigo-700",
    "bg-teal-100 text-teal-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-blue-100 text-blue-700",
    "bg-stone-200 text-stone-700",
  ];
  return colors[name.charCodeAt(0) % colors.length];
};

const METRIC_CONFIG = [
  {
    key: "total",
    label: "Total",
    icon: <Users size={16} color="#44403c" />,
    colorClass: "text-stone-700",
    bgClass: "bg-stone-50 border-stone-100",
    iconBg: "bg-stone-100",
  },
  {
    key: "active",
    label: "Ativos",
    icon: <CheckCircle size={16} color="#059669" />,
    colorClass: "text-emerald-700",
    bgClass: "bg-emerald-50 border-emerald-100",
    iconBg: "bg-emerald-100",
  },
  {
    key: "inactive",
    label: "Inativos",
    icon: <XCircle size={16} color="#dc2626" />,
    colorClass: "text-red-700",
    bgClass: "bg-red-50 border-red-100",
    iconBg: "bg-red-100",
  },
  {
    key: "withAddress",
    label: "Com Endereço",
    icon: <MapPin size={16} color="#4f46e5" />,
    colorClass: "text-indigo-700",
    bgClass: "bg-indigo-50 border-indigo-100",
    iconBg: "bg-indigo-100",
  },
];

const getTailwindStyles = (tailwindString: string) => {
  const styles: any = {};
  const parts = tailwindString.split(" ");

  parts.forEach((part) => {
    if (part.startsWith("bg-")) {
      const color = part.replace("bg-", "");
      if (color === "stone-800") styles.backgroundColor = "#292524";
      else if (color === "stone-900") styles.backgroundColor = "#1c1917";
      else if (color === "amber-50") styles.backgroundColor = "#fffbeb";
      else if (color === "emerald-700") styles.backgroundColor = "#047857";
      else if (color === "emerald-50") styles.backgroundColor = "#ecfdf5";
      else if (color === "red-800") styles.backgroundColor = "#991b1b";
      else if (color === "red-50") styles.backgroundColor = "#fef2f2";
      else if (color === "stone-200") styles.backgroundColor = "#e7e5e4";
      else if (color === "emerald-100") styles.backgroundColor = "#d1fae5";
      else if (color === "red-100") styles.backgroundColor = "#fee2e2";
      else if (color === "stone-50") styles.backgroundColor = "#fafaf9";
      else if (color === "indigo-50") styles.backgroundColor = "#eef2ff";
      else if (color === "blue-50") styles.backgroundColor = "#eff6ff";
      else if (color === "teal-50") styles.backgroundColor = "#f0fdfa";
      else if (color === "white/20") styles.backgroundColor = "rgba(255,255,255,0.2)";
      else if (color === "stone-100") styles.backgroundColor = "#f5f5f4";
      else if (color === "background") styles.backgroundColor = "#ffffff"; // Default background
      else if (color === "card") styles.backgroundColor = "#ffffff"; // Default card background
      else if (color === "amber-500") styles.backgroundColor = "#f59e0b";
    } else if (part.startsWith("text-")) {
      const color = part.replace("text-", "");
      if (color === "amber-50") styles.color = "#fffbeb";
      else if (color === "stone-700") styles.color = "#44403c";
      else if (color === "emerald-50") styles.color = "#ecfdf5";
      else if (color === "emerald-800") styles.color = "#065f46";
      else if (color === "red-50") styles.color = "#fef2f2";
      else if (color === "red-800") styles.color = "#991b1b";
      else if (color === "indigo-700") styles.color = "#4338ca";
      else if (color === "blue-700") styles.color = "#1d4ed8";
      else if (color === "teal-700") styles.color = "#0f766e";
      else if (color === "stone-500") styles.color = "#78716c";
      else if (color === "amber-700") styles.color = "#b45309";
      else if (color === "foreground") styles.color = "#0c0a09"; // Default foreground
      else if (color === "stone-600") styles.color = "#57534e";
      else if (color === "red-600") styles.color = "#dc2626";
      else if (color === "stone-400") styles.color = "#a8a29e";
      else if (color === "amber-500") styles.color = "#f59e0b";
      else if (color === "stone-300") styles.color = "#d6d3d1";
    } else if (part.startsWith("border-")) {
      const color = part.replace("border-", "");
      if (color === "stone-800") styles.borderColor = "#292524";
      else if (color === "stone-200") styles.borderColor = "#e7e5e4";
      else if (color === "emerald-700") styles.borderColor = "#047857";
      else if (color === "emerald-100") styles.borderColor = "#d1fae5";
      else if (color === "red-100") styles.borderColor = "#fee2e2";
      else if (color === "stone-100") styles.borderColor = "#f5f5f4";
      else if (color === "indigo-100") styles.borderColor = "#e0e7ff";
      else if (color === "blue-100") styles.borderColor = "#dbeafe";
      else if (color === "teal-100") styles.borderColor = "#ccfbf1";
      else if (color === "border/60") styles.borderColor = "rgba(229,231,235,0.6)"; // Assuming border is stone-200
      else if (color === "border/50") styles.borderColor = "rgba(229,231,235,0.5)";
      else if (color === "dashed") styles.borderStyle = "dashed";
      else if (color === "amber-100") styles.borderColor = "#fde68a";
    } else if (part.startsWith("px-")) {
      styles.paddingHorizontal = parseInt(part.replace("px-", "")) * 4;
    } else if (part.startsWith("py-")) {
      styles.paddingVertical = parseInt(part.replace("py-", "")) * 4;
    } else if (part.startsWith("p-")) {
      styles.padding = parseInt(part.replace("p-", "")) * 4;
    } else if (part.startsWith("pt-")) {
      styles.paddingTop = parseInt(part.replace("pt-", "")) * 4;
    } else if (part.startsWith("pb-")) {
      styles.paddingBottom = parseInt(part.replace("pb-", "")) * 4;
    } else if (part.startsWith("pl-")) {
      styles.paddingLeft = parseInt(part.replace("pl-", "")) * 4;
    } else if (part.startsWith("pr-")) {
      styles.paddingRight = parseInt(part.replace("pr-", "")) * 4;
    } else if (part.startsWith("m-")) {
      styles.margin = parseInt(part.replace("m-", "")) * 4;
    } else if (part.startsWith("mt-")) {
      styles.marginTop = parseInt(part.replace("mt-", "")) * 4;
    } else if (part.startsWith("mb-")) {
      styles.marginBottom = parseInt(part.replace("mb-", "")) * 4;
    } else if (part.startsWith("ml-")) {
      styles.marginLeft = parseInt(part.replace("ml-", "")) * 4;
    } else if (part.startsWith("mr-")) {
      styles.marginRight = parseInt(part.replace("mr-", "")) * 4;
    } else if (part.startsWith("gap-")) {
      styles.gap = parseInt(part.replace("gap-", "")) * 4;
    } else if (part.startsWith("w-")) {
      styles.width = parseInt(part.replace("w-", "")) * 4;
    } else if (part.startsWith("h-")) {
      styles.height = parseInt(part.replace("h-", "")) * 4;
    } else if (part.startsWith("min-w-")) {
      styles.minWidth = parseInt(part.replace("min-w-", "")) * 4;
    } else if (part.startsWith("rounded-")) {
      if (part === "rounded-full") styles.borderRadius = 9999;
      else if (part === "rounded-xl") styles.borderRadius = 12;
      else if (part === "rounded-2xl") styles.borderRadius = 16;
      else if (part === "rounded-lg") styles.borderRadius = 8;
    } else if (part === "flex") styles.display = "flex";
    else if (part === "flex-col") styles.flexDirection = "column";
    else if (part === "flex-row") styles.flexDirection = "row";
    else if (part === "items-center") styles.alignItems = "center";
    else if (part === "justify-center") styles.justifyContent = "center";
    else if (part === "justify-between") styles.justifyContent = "space-between";
    else if (part === "flex-wrap") styles.flexWrap = "wrap";
    else if (part === "flex-1") styles.flex = 1;
    else if (part === "shrink-0") styles.flexShrink = 0;
    else if (part === "min-h-screen") styles.minHeight = "100%";
    else if (part === "text-sm") styles.fontSize = 14;
    else if (part === "text-xs") styles.fontSize = 12;
    else if (part === "text-[10px]") styles.fontSize = 10;
    else if (part === "text-lg") styles.fontSize = 18;
    else if (part === "text-2xl") styles.fontSize = 24;
    else if (part === "text-4xl") styles.fontSize = 36;
    else if (part === "font-bold") styles.fontWeight = "700";
    else if (part === "font-black") styles.fontWeight = "900";
    else if (part === "font-semibold") styles.fontWeight = "600";
    else if (part === "font-medium") styles.fontWeight = "500";
    else if (part === "uppercase") styles.textTransform = "uppercase";
    else if (part === "tracking-tight") styles.letterSpacing = -0.5;
    else if (part === "tracking-wider") styles.letterSpacing = 0.5;
    else if (part === "tracking-widest") styles.letterSpacing = 1;
    else if (part === "text-left") styles.textAlign = "left";
    else if (part === "text-right") styles.textAlign = "right";
    else if (part === "text-center") styles.textAlign = "center";
    else if (part === "relative") styles.position = "relative";
    else if (part === "absolute") styles.position = "absolute";
    else if (part === "top-1/2") styles.top = "50%";
    else if (part === "-translate-y-1/2") styles.transform = [{ translateY: -50 }];
    else if (part === "outline-none") styles.outlineWidth = 0;
    else if (part === "shadow-sm") styles.shadowColor = "#000";
    else if (part === "shadow-sm") styles.shadowOffset = { width: 0, height: 1 };
    else if (part === "shadow-sm") styles.shadowOpacity = 0.05;
    else if (part === "shadow-sm") styles.shadowRadius = 2;
    else if (part === "elevation-1") styles.elevation = 1; // Android shadow
    else if (part === "transition-colors") styles.transitionProperty = "color, background-color, border-color";
    else if (part === "transition-all") styles.transitionProperty = "all";
    else if (part === "hover:bg-stone-900") styles.hoverBgStone900 = "#1c1917";
    else if (part === "hover:bg-stone-50") styles.hoverBgStone50 = "#fafaf9";
    else if (part === "hover:border-stone-400") styles.hoverBorderStone400 = "#a8a29e";
    else if (part === "hover:text-red-600") styles.hoverTextRed600 = "#dc2626";
    else if (part === "hover:bg-stone-100") styles.hoverBgStone100 = "#f5f5f4";
    else if (part === "hover:text-stone-700") styles.hoverTextStone700 = "#44403c";
    else if (part === "hover:bg-red-50") styles.hoverBgRed50 = "#fef2f2";
    else if (part === "hover:bg-red-100") styles.hoverBgRed100 = "#fee2e2";
    else if (part === "hover:bg-stone-200") styles.hoverBgStone200 = "#e7e5e4";
    else if (part === "disabled:opacity-50") styles.disabledOpacity50 = 0.5;
    else if (part === "opacity-80") styles.opacity = 0.8;
    else if (part === "opacity-50") styles.opacity = 0.5;
    else if (part === "overflow-hidden") styles.overflow = "hidden";
    else if (part === "overflow-x-auto") styles.overflowX = "scroll";
    else if (part === "overflow-y-auto") styles.overflowY = "scroll";
    else if (part === "divide-y") styles.borderBottomWidth = 1;
    else if (part === "divide-border/50") styles.borderBottomColor = "rgba(229,231,235,0.5)";
    else if (part === "whitespace-nowrap") styles.whiteSpace = "nowrap";
    else if (part === "truncate") styles.overflow = "hidden";
    else if (part === "truncate") styles.whiteSpace = "nowrap";
    else if (part === "truncate") styles.textOverflow = "ellipsis";
    else if (part === "underline") styles.textDecorationLine = "underline";
    else if (part === "underline-offset-2") styles.textUnderlineOffset = 2;
    else if (part === "border") styles.borderWidth = 1;
    else if (part === "inset-0") styles.position = "absolute";
    else if (part === "inset-0") styles.top = 0;
    else if (part === "inset-0") styles.bottom = 0;
    else if (part === "inset-0") styles.left = 0;
    else if (part === "inset-0") styles.right = 0;
    else if (part === "z-50") styles.zIndex = 50;
    else if (part === "max-w-7xl") styles.maxWidth = 1280;
    else if (part === "mx-auto") styles.marginHorizontal = "auto";
    else if (part === "sm:px-6") styles.paddingHorizontalSm = 24;
    else if (part === "lg:px-8") styles.paddingHorizontalLg = 32;
    else if (part === "sm:flex-row") styles.flexDirectionSm = "row";
    else if (part === "sm:items-center") styles.alignItemsSm = "center";
    else if (part === "sm:justify-between") styles.justifyContentSm = "space-between";
    else if (part === "sm:max-w-[680px]") styles.maxWidthSm = 680;
    else if (part === "sm:max-w-[520px]") styles.maxWidthSm = 520;
    else if (part === "max-h-[70vh]") styles.maxHeight = "70%";
  });

  return styles;
};

const cn = (...args: (string | undefined | null | false)[]) => {
  const classNames = args.filter(Boolean).join(" ");
  return getTailwindStyles(classNames);
};

const UserManagement = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isUserFormModalOpen, setIsUserFormModalOpen] = useState(false);
  const [isAddressFormModalOpen, setIsAddressFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponseDTO | null>(null);
  const [editingAddress, setEditingAddress] = useState<AddressResponseDTO | null>(null);

  const [userForm, setUserForm] = useState<UserRequestDTO>({
    email: "",
    name: "",
    phone: "",
    active: true,
    scopeIds: [],
  });
  const [userPassword, setUserPassword] = useState("");
  const [addressForm, setAddressForm] = useState<AddressRequestDTO>({
    street: "",
    number: "",
    complement: "",
    state: "",
    city: "",
    cep: "",
    isDefault: false,
    userId: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("ALL");

  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);

  const { data: users, isLoading: isLoadingUsers } = useQuery<UserResponseDTO[]>({
    queryKey: ["users"],
    queryFn: async () => (await usersApi.getAll()).data,
  });

  const { data: scopes, isLoading: isLoadingScopes } = useQuery<ScopeResponseDTO[]>({
    queryKey: ["scopes"],
    queryFn: async () => (await scopesApi.getAll()).data,
  });

  const { data: userAddresses, isLoading: isLoadingUserAddresses } = useQuery<AddressResponseDTO[]>({
    queryKey: ["userAddresses", editingUser?.id],
    queryFn: async () => {
      if (!editingUser?.id) return [];
      return (await addressesApi.getByUserId(editingUser.id)).data;
    },
    enabled: !!editingUser?.id,
  });

  const metrics = useMemo(
    () => ({
      total: users?.length ?? 0,
      active: users?.filter((u) => u.active).length ?? 0,
      inactive: users?.filter((u) => !u.active).length ?? 0,
      withAddress: 0,
    }),
    [users]
  );

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => {
      const matchesSearch =
        !searchTerm ||
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone?.includes(searchTerm);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && u.active) ||
        (statusFilter === "INACTIVE" && !u.active);

      const matchesScope =
        scopeFilter === "ALL" ||
        u.scopes.some(
          (s) =>
            s.name === scopeFilter ||
            s.name === `SCOPE_${scopeFilter}` ||
            s.name.replace("SCOPE_", "") === scopeFilter
        );

      return matchesSearch && matchesStatus && matchesScope;
    });
  }, [users, searchTerm, statusFilter, scopeFilter]);

  const hasActiveFilters =
    statusFilter !== "ALL" || scopeFilter !== "ALL" || !!searchTerm;

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setScopeFilter("ALL");
  };

  const countByStatus = (s: StatusFilter) => {
    if (!users) return 0;
    if (s === "ALL") return users.length;
    if (s === "ACTIVE") return users.filter((u) => u.active).length;
    return users.filter((u) => !u.active).length;
  };

  const countByScope = (scopeName: string) => {
    if (!users) return 0;
    return users.filter((u) =>
      u.scopes.some(
        (s) =>
          s.name === scopeName ||
          s.name === `SCOPE_${scopeName}` ||
          s.name.replace("SCOPE_", "") === scopeName
      )
    ).length;
  };

  const createUserMutation = useMutation({
    mutationFn: (data: UserRequestDTO) => usersApi.create(data),
    onSuccess: () => {
      toast({ title: "Usuário criado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeUserFormModal();
    },
    onError: () =>
      toast({ title: "Erro ao criar usuário.", variant: "destructive" }),
  });

  const updateUserMutation = useMutation({
    mutationFn: (d: { id: number; data: UserRequestDTO }) =>
      usersApi.update(d.id, d.data),
    onSuccess: () => {
      toast({ title: "Usuário atualizado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeUserFormModal();
    },
    onError: () =>
      toast({ title: "Erro ao atualizar usuário.", variant: "destructive" }),
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (d: { id: number; newPassword: string }) =>
      usersApi.updatePassword(d.id, d.newPassword),
    onSuccess: () => toast({ title: "Senha atualizada com sucesso." }),
    onError: () =>
      toast({ title: "Erro ao atualizar senha.", variant: "destructive" }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      toast({ title: "Usuário removido." });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () =>
      toast({ title: "Erro ao remover usuário.", variant: "destructive" }),
  });

  const createAddressMutation = useMutation({
    mutationFn: (data: AddressRequestDTO) => addressesApi.create(data),
    onSuccess: () => {
      toast({ title: "Endereço adicionado." });
      queryClient.invalidateQueries({ queryKey: ["userAddresses", editingUser?.id] });
      closeAddressFormModal();
    },
    onError: () =>
      toast({ title: "Erro ao criar endereço.", variant: "destructive" }),
  });

  const updateAddressMutation = useMutation({
    mutationFn: (d: { id: number; data: AddressRequestDTO }) =>
      addressesApi.update(d.id, d.data),
    onSuccess: () => {
      toast({ title: "Endereço atualizado." });
      queryClient.invalidateQueries({ queryKey: ["userAddresses", editingUser?.id] });
      closeAddressFormModal();
    },
    onError: () =>
      toast({ title: "Erro ao atualizar endereço.", variant: "destructive" }),
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: number) => addressesApi.delete(id),
    onSuccess: () => {
      toast({ title: "Endereço removido." });
      queryClient.invalidateQueries({ queryKey: ["userAddresses", editingUser?.id] });
    },
    onError: () =>
      toast({ title: "Erro ao remover endereço.", variant: "destructive" }),
  });

  const openCreateUserModal = () => {
    setEditingUser(null);
    setUserForm({ email: "", name: "", phone: "", active: true, scopeIds: [] });
    setUserPassword("");
    setIsUserFormModalOpen(true);
  };

  const openEditUserModal = (user: UserResponseDTO) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      name: user.name,
      phone: user.phone,
      active: user.active,
      scopeIds: user.scopes.length > 0 ? [user.scopes[0].id] : [],
    });
    setUserPassword("");
    setIsUserFormModalOpen(true);
  };

  const closeUserFormModal = () => {
    setIsUserFormModalOpen(false);
    setEditingUser(null);
    setUserForm({ email: "", name: "", phone: "", active: true, scopeIds: [] });
    setUserPassword("");
  };

  const openCreateAddressModal = () => {
    if (!editingUser) return;
    setEditingAddress(null);
    setAddressForm({
      street: "", number: "", complement: "", state: "",
      city: "", cep: "", isDefault: false, userId: editingUser.id,
    });
    setIsAddressFormModalOpen(true);
  };

  const openEditAddressModal = (address: AddressResponseDTO) => {
    if (!editingUser) return;
    setEditingAddress(address);
    setAddressForm({
      street: address.street, number: address.number,
      complement: address.complement, state: address.state,
      city: address.city, cep: address.cep,
      isDefault: address.isDefault, userId: editingUser.id,
    });
    setIsAddressFormModalOpen(true);
  };

  const closeAddressFormModal = () => {
    setIsAddressFormModalOpen(false);
    setEditingAddress(null);
    setAddressForm({
      street: "", number: "", complement: "", state: "",
      city: "", cep: "", isDefault: false, userId: 0,
    });
  };

  const handleUserSubmit = async () => {
    try {
      if (editingUser) {
        await updateUserMutation.mutateAsync({ id: editingUser.id, data: userForm });
        if (userPassword) {
          await updatePasswordMutation.mutateAsync({ id: editingUser.id, newPassword: userPassword });
        }
      } else {
        if (!userPassword) {
          toast({ title: "Senha obrigatória para novos usuários.", variant: "destructive" });
          return;
        }
        await createUserMutation.mutateAsync({ ...userForm, password: userPassword });
      }
    } catch {
      // handled by mutations
    }
  };

  const handleAddressSubmit = () => {
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: addressForm });
    } else {
      createAddressMutation.mutate(addressForm);
    }
  };

  if (isLoadingUsers || isLoadingScopes) {
    return (
      <SafeAreaView style={cn("min-h-screen bg-background flex items-center justify-center")}>
        <View style={cn("flex flex-col items-center gap-3")}>
          <ActivityIndicator size="large" color="#a8a29e" />
          <Text style={cn("text-stone-500 text-sm font-medium")}>Carregando usuários...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={cn("min-h-screen bg-background")}>
      <ScrollView contentContainerStyle={cn("pt-6 pb-6")} style={cn("flex-1")}>
        <View style={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8")}>
          <Animated.View
            entering={FadeIn.duration(400).delay(0)}
            style={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4")}
          >
            <View>
              <Text style={cn("font-serif text-4xl font-bold text-foreground tracking-tight")}>
                Gestão de Usuários
              </Text>
              <Text style={cn("text-stone-500 text-sm mt-1")}>
                {filteredUsers.length > 0
                  ? `${filteredUsers.length} usuário${filteredUsers.length !== 1 ? "s" : ""} encontrado${filteredUsers.length !== 1 ? "s" : ""}`
                  : "Nenhum usuário cadastrado"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={openCreateUserModal}
              style={cn(
                "inline-flex items-center gap-2 rounded-xl bg-stone-800 px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors",
                { hoverBgStone900: true }
              )}
            >
              <UserPlus size={16} color="#fffbeb" />
              <Text style={cn("text-amber-50 text-sm font-semibold")}>Novo Usuário</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            entering={FadeIn.duration(400).delay(50)}
            style={cn("grid grid-cols-2 lg:grid-cols-4 gap-3")}
          >
            {METRIC_CONFIG.map((m) => (
              <View
                key={m.key}
                style={cn(
                  "rounded-2xl border p-4 flex flex-col gap-2 transition-all",
                  m.bgClass
                )}
              >
                <View style={cn("w-8 h-8 rounded-xl flex items-center justify-center", m.iconBg)}>
                  <Text style={cn(m.colorClass)}>{m.icon}</Text>
                </View>
                <View>
                  <Text style={cn("text-2xl font-black", m.colorClass)}>
                    {metrics[m.key as keyof typeof metrics]}
                  </Text>
                  <Text style={cn("text-xs font-semibold mt-0.5 opacity-80", m.colorClass)}>
                    {m.label}
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>

          <Animated.View
            entering={FadeIn.duration(400).delay(100)}
            style={cn("space-y-4")}
          >
            <View style={cn("relative")}>
              <Search size={16} color="#a8a29e" style={cn("absolute left-3.5 top-1/2 -translate-y-1/2")} />
              <TextInput
                placeholder="Buscar por nome, e-mail ou telefone..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                style={cn(
                  "w-full pl-10 pr-10 py-3 rounded-xl border border-stone-200 bg-card text-foreground text-sm outline-none",
                  { placeholderTextColor: "#a8a29e" }
                )}
              />
              {searchTerm ? (
                <TouchableOpacity
                  onPress={() => setSearchTerm("")}
                  style={cn("absolute right-3.5 top-1/2 -translate-y-1/2")}
                >
                  <X size={16} color="#a8a29e" />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={cn("bg-card rounded-2xl border border-border/60 p-5 sm:p-6 space-y-5 shadow-sm")}>
              <View style={cn("space-y-2")}>
                <Text style={cn("text-[10px] font-black uppercase tracking-widest text-stone-500")}>
                  Status
                </Text>
                <View style={cn("flex flex-wrap gap-2")}>
                  {STATUS_FILTER_CONFIG.map((f) => {
                    const isActive = statusFilter === f.value;
                    const count = countByStatus(f.value);
                    return (
                      <TouchableOpacity
                        key={f.value}
                        onPress={() => setStatusFilter(f.value)}
                        style={cn(
                          "flex flex-row items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold border transition-all",
                          isActive
                            ? f.activeClass + " shadow-sm"
                            : "bg-background border-stone-200 text-stone-600",
                          isActive ? {} : { hoverBorderStone400: true, hoverBgStone50: true }
                        )}
                      >
                        {React.cloneElement(f.icon as React.ReactElement, {
                          color: isActive ? "#fffbeb" : "#a8a29e",
                        })}
                        <Text style={cn(isActive ? "text-amber-50" : "text-stone-600", "text-sm font-semibold")}>
                          {f.label}
                        </Text>
                        <Text
                          style={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-black",
                            isActive ? "bg-white/20 text-white" : f.badgeClass
                          )}
                        >
                          {count}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {scopes && scopes.length > 0 ? (
                <View style={cn("space-y-2")}>
                  <Text style={cn("text-[10px] font-black uppercase tracking-widest text-stone-500 flex items-center gap-1")}>
                    <ShieldCheck size={12} color="#78716c" /> Permissões
                  </Text>
                  <View style={cn("flex flex-wrap gap-2")}>
                    <TouchableOpacity
                      onPress={() => setScopeFilter("ALL")}
                      style={cn(
                        "rounded-xl px-3 py-1.5 text-xs font-bold border transition-all",
                        scopeFilter === "ALL"
                          ? "bg-stone-800 text-amber-50 border-stone-800"
                          : "bg-background border-stone-200 text-stone-600",
                        scopeFilter === "ALL" ? {} : { hoverBgStone50: true }
                      )}
                    >
                      <Text style={cn(scopeFilter === "ALL" ? "text-amber-50" : "text-stone-600", "text-xs font-bold")}>
                        Todos
                      </Text>
                    </TouchableOpacity>
                    {scopes.map((scope) => {
                      const displayName = scope.name.replace("SCOPE_", "");
                      const isActive = scopeFilter === displayName || scopeFilter === scope.name;
                      const count = countByScope(displayName);
                      return (
                        <TouchableOpacity
                          key={scope.id}
                          onPress={() => setScopeFilter(isActive ? "ALL" : displayName)}
                          style={cn(
                            "flex flex-row items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all",
                            isActive
                              ? "bg-stone-800 text-amber-50 border-stone-800"
                              : "bg-background border-stone-200 text-stone-600",
                            isActive ? {} : { hoverBgStone50: true }
                          )}
                        >
                          <Text style={cn(isActive ? "text-amber-50" : "text-stone-600", "text-xs font-bold")}>
                            {displayName}
                          </Text>
                          <Text
                            style={cn(
                              "rounded-full px-1.5 py-0.5 text-[10px] font-black",
                              isActive ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"
                            )}
                          >
                            {count}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : null}
            </View>

            {hasActiveFilters ? (
              <Animated.View
                entering={FadeIn.duration(200).delay(0)}
                exiting={FadeOut.duration(200)}
                style={cn("flex flex-wrap items-center gap-2")}
              >
                <Text style={cn("text-xs text-stone-500 font-medium")}>
                  Mostrando{" "}
                  <Text style={cn("font-black text-foreground")}>{filteredUsers.length}</Text>{" "}
                  {filteredUsers.length === 1 ? "usuário" : "usuários"}
                </Text>

                {statusFilter !== "ALL" ? (
                  <View style={cn("inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 px-3 py-1 text-xs font-bold")}>
                    <Text style={cn("text-stone-700 text-xs font-bold")}>
                      {STATUS_FILTER_CONFIG.find((f) => f.value === statusFilter)?.label}
                    </Text>
                    <TouchableOpacity onPress={() => setStatusFilter("ALL")} style={cn({ hoverTextRed600: true })}>
                      <X size={12} color="#78716c" />
                    </TouchableOpacity>
                  </View>
                ) : null}

                {scopeFilter !== "ALL" ? (
                  <View style={cn("inline-flex items-center gap-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 px-3 py-1 text-xs font-bold")}>
                    <Text style={cn("text-stone-700 text-xs font-bold")}>
                      {scopeFilter}
                    </Text>
                    <TouchableOpacity onPress={() => setScopeFilter("ALL")} style={cn({ hoverTextRed600: true })}>
                      <X size={12} color="#78716c" />
                    </TouchableOpacity>
                  </View>
                ) : null}

                <TouchableOpacity
                  onPress={clearAllFilters}
                  style={cn("mt-1 text-xs font-bold text-stone-500 underline underline-offset-2", { hoverTextRed600: true })}
                >
                  <Text style={cn("text-xs font-bold text-stone-500 underline")}>
                    Limpar tudo
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ) : null}
          </Animated.View>

          <Animated.View
            entering={FadeIn.duration(400).delay(200)}
            style={cn("bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden")}
          >
            {filteredUsers.length > 0 ? (
              <View style={cn("divide-y divide-border/50")}>
                {filteredUsers.map((user) => {
                  const isExpanded = expandedCardId === user.id;
                  return (
                    <Animated.View
                      key={user.id}
                      layout={Layout.springify()}
                      entering={FadeIn}
                      exiting={FadeOut}
                      style={cn("p-4")}
                    >
                      <TouchableOpacity
                        onPress={() => setExpandedCardId(isExpanded ? null : user.id)}
                        style={cn("flex flex-row items-center gap-3")}
                        activeOpacity={0.7}
                      >
                        <View
                          style={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center font-black text-sm shrink-0 uppercase",
                            getAvatarClass(user.name)
                          )}
                        >
                          <Text style={cn("font-black text-sm", getAvatarClass(user.name))}>
                            {user.name.charAt(0)}
                          </Text>
                        </View>

                        <View style={cn("flex-1 min-w-0")}>
                          <View style={cn("flex flex-row items-center justify-between gap-2")}>
                            <Text style={cn("font-bold text-foreground truncate")}>{user.name}</Text>
                            <View
                              style={cn(
                                "shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                user.active
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  : "bg-red-50 text-red-700 border-red-100"
                              )}
                            >
                              <Text style={cn(user.active ? "text-emerald-700" : "text-red-700", "text-[10px] font-bold")}>
                                {user.active ? "Ativo" : "Inativo"}
                              </Text>
                            </View>
                          </View>
                          <Text style={cn("text-xs text-stone-400 truncate mt-0.5")}>{user.email}</Text>
                          <View style={cn("flex flex-wrap gap-1 mt-1.5")}>
                            {user.scopes.map((s) => (
                              <Text
                                key={s.id}
                                style={cn(
                                  "px-2 py-0.5 rounded-full text-[9px] font-black uppercase",
                                  getScopeBadgeClass(s.name)
                                )}
                              >
                                {s.name.replace("SCOPE_", "")}
                              </Text>
                            ))}
                          </View>
                        </View>

                        <View style={cn("shrink-0 text-stone-400")}>
                          {isExpanded ? (
                            <ChevronUp size={16} color="#a8a29e" />
                          ) : (
                            <ChevronDown size={16} color="#a8a29e" />
                          )}
                        </View>
                      </TouchableOpacity>

                      {isExpanded ? (
                        <Animated.View
                          entering={SlideInDown.duration(200)}
                          exiting={SlideOutDown.duration(200)}
                          style={cn("overflow-hidden")}
                        >
                          <View style={cn("pt-4 space-y-3")}>
                            <View style={cn("grid grid-cols-2 gap-2")}>
                              <View style={cn("rounded-xl bg-stone-50 border border-stone-100 p-3")}>
                                <Text style={cn("text-[9px] uppercase font-black text-stone-400 mb-1")}>E-mail</Text>
                                <Text style={cn("text-xs font-semibold text-foreground truncate")}>{user.email}</Text>
                              </View>
                              <View style={cn("rounded-xl bg-stone-50 border border-stone-100 p-3")}>
                                <Text style={cn("text-[9px] uppercase font-black text-stone-400 mb-1")}>Telefone</Text>
                                <Text style={cn("text-xs font-semibold text-foreground")}>{user.phone || "—"}</Text>
                              </View>
                            </View>

                            {user.registerDate ? (
                              <View style={cn("rounded-xl bg-stone-50 border border-stone-100 p-3")}>
                                <Text style={cn("text-[9px] uppercase font-black text-stone-400 mb-1")}>Cadastrado em</Text>
                                <Text style={cn("text-xs font-semibold text-foreground")}>
                                  {new Date(user.registerDate).toLocaleDateString("pt-BR", {
                                    day: "2-digit", month: "long", year: "numeric"
                                  })}
                                </Text>
                              </View>
                            ) : null}

                            <View style={cn("flex flex-row gap-2 pt-1")}>
                              <TouchableOpacity
                                onPress={() => openEditUserModal(user)}
                                style={cn(
                                  "flex-1 flex flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border border-stone-200 bg-background text-stone-700 text-xs font-bold",
                                  { hoverBgStone50: true }
                                )}
                              >
                                <Edit size={14} color="#44403c" />
                                <Text style={cn("text-stone-700 text-xs font-bold")}>Editar</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => {
                                  Alert.alert(
                                    "Confirmar exclusão",
                                    "Deseja realmente remover este usuário?",
                                    [
                                      { text: "Cancelar", style: "cancel" },
                                      { text: "Remover", onPress: () => deleteUserMutation.mutate(user.id) },
                                    ]
                                  );
                                }}
                                disabled={deleteUserMutation.isPending}
                                style={cn(
                                  "flex-1 flex flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-100 bg-red-50 text-red-700 text-xs font-bold",
                                  { hoverBgRed100: true, disabledOpacity50: deleteUserMutation.isPending }
                                )}
                              >
                                {deleteUserMutation.isPending ? (
                                  <ActivityIndicator size="small" color="#dc2626" />
                                ) : (
                                  <Trash2 size={14} color="#dc2626" />
                                )}
                                <Text style={cn("text-red-700 text-xs font-bold")}>Remover</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </Animated.View>
                      ) : null}
                    </Animated.View>
                  );
                })}
              </View>
            ) : (
              <View style={cn("py-20 text-center")}>
                <View style={cn("flex flex-col items-center gap-3 text-stone-400")}>
                  <View style={cn("w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center")}>
                    <Users size={24} color="#a8a29e" style={cn("opacity-50")} />
                  </View>
                  <Text style={cn("font-serif text-lg font-semibold text-stone-500")}>
                    Nenhum usuário encontrado
                  </Text>
                  <Text style={cn("text-xs")}>
                    {hasActiveFilters
                      ? "Tente remover ou combinar filtros diferentes."
                      : "Adicione o primeiro usuário ao sistema."}
                  </Text>
                  {hasActiveFilters ? (
                    <TouchableOpacity
                      onPress={clearAllFilters}
                      style={cn("mt-1 text-xs font-bold text-stone-600 underline underline-offset-2", { hoverTextRed600: true })}
                    >
                      <Text style={cn("text-xs font-bold text-stone-600 underline")}>
                        Limpar todos os filtros
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            )}
          </Animated.View>
        </View>
      </ScrollView>

      <Dialog open={isUserFormModalOpen} onOpenChange={setIsUserFormModalOpen}>
        <DialogContent style={cn("sm:max-w-[680px] bg-card text-foreground rounded-2xl p-0 overflow-hidden")}>
          <View style={cn("px-6 pt-6 pb-4 border-b border-border/50 bg-stone-50/80")}>
            <DialogHeader>
              <DialogTitle style={cn("font-serif text-2xl font-bold text-foreground flex flex-row items-center gap-2")}>
                {editingUser ? (
                  <>
                    <UserCog size={20} color="#78716c" />
                    <Text style={cn("text-foreground text-2xl font-bold")}>Editar Usuário</Text>
                  </>
                ) : (
                  <>
                    <UserPlus size={20} color="#78716c" />
                    <Text style={cn("text-foreground text-2xl font-bold")}>Novo Usuário</Text>
                  </>
                )}
              </DialogTitle>
              <DialogDescription style={cn("text-stone-500 text-sm")}>
                {editingUser
                  ? "Atualize as informações do usuário abaixo."
                  : "Preencha os dados para criar um novo acesso."}
              </DialogDescription>
            </DialogHeader>
          </View>

          <ScrollView style={cn("px-6 py-5 max-h-[70vh]")} contentContainerStyle={cn("space-y-5")}>
            <View style={cn("grid grid-cols-1 sm:grid-cols-2 gap-4")}>
              <View style={cn("space-y-1.5")}>
                <Text style={cn("text-xs font-black uppercase text-stone-500")}>
                  Nome Completo
                </Text>
                <TextInput
                  value={userForm.name}
                  onChangeText={(text) => setUserForm((p) => ({ ...p, name: text }))}
                  placeholder="Ex: João da Silva"
                  style={cn("rounded-xl border-stone-200 bg-background focus:ring-stone-300 px-3 py-2 text-foreground")}
                  required
                />
              </View>
              <View style={cn("space-y-1.5")}>
                <Text style={cn("text-xs font-black uppercase text-stone-500 flex flex-row items-center gap-1")}>
                  <Phone size={12} color="#78716c" /> Telefone
                </Text>
                <TextInput
                  value={userForm.phone}
                  onChangeText={(text) => setUserForm((p) => ({ ...p, phone: text }))}
                  placeholder="(11) 99999-9999"
                  style={cn("rounded-xl border-stone-200 bg-background focus:ring-stone-300 px-3 py-2 text-foreground")}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={cn("space-y-1.5")}>
              <Text style={cn("text-xs font-black uppercase text-stone-500 flex flex-row items-center gap-1")}>
                <Mail size={12} color="#78716c" /> E-mail
              </Text>
              <TextInput
                value={userForm.email}
                onChangeText={(text) => setUserForm((p) => ({ ...p, email: text }))}
                placeholder="email@exemplo.com"
                style={cn("rounded-xl border-stone-200 bg-background focus:ring-stone-300 px-3 py-2 text-foreground")}
                keyboardType="email-address"
                required
              />
            </View>

            <View style={cn("space-y-1.5")}>
              <Text style={cn("text-xs font-black uppercase text-stone-500 flex flex-row items-center gap-1")}>
                <Key size={12} color="#78716c" />
                {editingUser ? "Nova Senha (opcional)" : "Senha"}
              </Text>
              <TextInput
                value={userPassword}
                onChangeText={setUserPassword}
                placeholder={editingUser ? "Deixe em branco para não alterar" : "••••••••"}
                secureTextEntry
                style={cn("rounded-xl border-stone-200 bg-background focus:ring-stone-300 px-3 py-2 text-foreground")}
                required={!editingUser}
              />
            </View>

            {scopes && scopes.length > 0 ? (
              <View style={cn("space-y-2")}>
                <Text style={cn("text-xs font-black uppercase text-stone-500 flex flex-row items-center gap-1")}>
                  <ShieldCheck size={12} color="#78716c" /> Permissões
                </Text>
                <View style={cn("flex flex-wrap gap-2")}>
                  {scopes.map((scope) => {
                    const isSelected = userForm.scopeIds?.includes(scope.id);
                    return (
                      <TouchableOpacity
                        key={scope.id}
                        onPress={() => {
                          const current = userForm.scopeIds ?? [];
                          const updated = isSelected
                            ? current.filter((id) => id !== scope.id)
                            : [...current, scope.id];
                          setUserForm((p) => ({ ...p, scopeIds: updated }));
                        }}
                        style={cn(
                          "rounded-xl px-3.5 py-2 text-xs font-bold border transition-all",
                          isSelected
                            ? "bg-stone-800 text-amber-50 border-stone-800 shadow-sm"
                            : "bg-background border-stone-200 text-stone-600",
                          isSelected ? {} : { hoverBgStone50: true }
                        )}
                      >
                        <Text style={cn(isSelected ? "text-amber-50" : "text-stone-600", "text-xs font-bold")}>
                          {scope.name.replace("SCOPE_", "")}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View style={cn("flex flex-row items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-4 py-3")}>
              <View>
                <Text style={cn("text-sm font-bold text-foreground")}>Usuário Ativo</Text>
                <Text style={cn("text-xs text-stone-500")}>Permite ou bloqueia o acesso ao sistema</Text>
              </View>
              <Switch
                checked={userForm.active}
                onCheckedChange={(v) => setUserForm((p) => ({ ...p, active: v }))}
              />
            </View>

            {editingUser ? (
              <View style={cn("border-t border-dashed border-stone-200 pt-5 space-y-4")}>
                <View style={cn("flex flex-row items-center justify-between")}>
                  <View>
                    <Text style={cn("text-sm font-bold text-foreground flex flex-row items-center gap-1.5")}>
                      <MapPin size={16} color="#78716c" /> Endereços
                    </Text>
                    <Text style={cn("text-xs text-stone-500 mt-0.5")}>
                      Gerencie os endereços deste usuário
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={openCreateAddressModal}
                    style={cn(
                      "inline-flex items-center gap-1.5 rounded-xl bg-stone-100 px-3 py-2 text-xs font-bold",
                      { hoverBgStone200: true }
                    )}
                  >
                    <Plus size={14} color="#44403c" />
                    <Text style={cn("text-stone-700 text-xs font-bold")}>Adicionar</Text>
                  </TouchableOpacity>
                </View>

                {isLoadingUserAddresses ? (
                  <View style={cn("flex flex-row items-center justify-center py-6 text-stone-400")}>
                    <ActivityIndicator size="small" color="#a8a29e" style={cn("mr-2")} />
                    <Text style={cn("text-sm")}>Carregando endereços...</Text>
                  </View>
                ) : userAddresses && userAddresses.length > 0 ? (
                  <View style={cn("space-y-2")}>
                    {userAddresses.map((address) => (
                      <View
                        key={address.id}
                        style={cn("flex flex-row items-start justify-between gap-3 p-4 rounded-xl border border-stone-100 bg-stone-50/80")}
                      >
                        <View style={cn("flex flex-row items-start gap-3 min-w-0")}>
                          <View style={cn("w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center shrink-0")}>
                            <Home size={16} color="#78716c" />
                          </View>
                          <View style={cn("min-w-0")}>
                            <View style={cn("flex flex-row items-center gap-2")}>
                              <Text style={cn("text-sm font-bold text-foreground truncate")}>
                                {address.street}, {address.number}
                                {address.complement && ` — ${address.complement}`}
                              </Text>
                              {address.isDefault ? (
                                <View style={cn("shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-black uppercase")}>
                                  <Star size={10} color="#b45309" />
                                  <Text style={cn("text-amber-700 text-[9px] font-black")}>Padrão</Text>
                                </View>
                              ) : null}
                            </View>
                            <Text style={cn("text-xs text-stone-500 mt-0.5")}>
                              {address.city}, {address.state} — CEP: {address.cep}
                            </Text>
                          </View>
                        </View>
                        <View style={cn("flex flex-row shrink-0 gap-1")}>
                          <TouchableOpacity
                            onPress={() => openEditAddressModal(address)}
                            style={cn("p-1.5 rounded-lg text-stone-400", { hoverBgStone200: true, hoverTextStone700: true })}
                          >
                            <Edit size={14} color="#a8a29e" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              Alert.alert(
                                "Confirmar exclusão",
                                "Deseja realmente remover este endereço?",
                                [
                                  { text: "Cancelar", style: "cancel" },
                                  { text: "Remover", onPress: () => deleteAddressMutation.mutate(address.id) },
                                ]
                              );
                            }}
                            disabled={deleteAddressMutation.isPending}
                            style={cn("p-1.5 rounded-lg text-stone-400", { hoverBgRed50: true, hoverTextRed600: true, disabledOpacity50: deleteAddressMutation.isPending })}
                          >
                            {deleteAddressMutation.isPending ? (
                              <ActivityIndicator size="small" color="#dc2626" />
                            ) : (
                              <Trash2 size={14} color="#a8a29e" />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={cn("py-8 text-center rounded-xl border border-dashed border-stone-200")}>
                    <Home size={32} color="#d6d3d1" style={cn("mx-auto mb-2")} />
                    <Text style={cn("text-sm text-stone-400 font-medium")}>
                      Nenhum endereço cadastrado
                    </Text>
                  </View>
                )}
              </View>
            ) : null}
          </ScrollView>

          <DialogFooter style={cn("pt-2 flex flex-row gap-3 px-6 pb-6")}>
            <TouchableOpacity
              onPress={closeUserFormModal}
              style={cn(
                "flex-1 py-2.5 rounded-xl border border-stone-200 bg-background text-stone-700 text-sm font-bold",
                { hoverBgStone50: true }
              )}
            >
              <Text style={cn("text-stone-700 text-sm font-bold text-center")}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleUserSubmit}
              disabled={
                createUserMutation.isPending ||
                updateUserMutation.isPending ||
                updatePasswordMutation.isPending
              }
              style={cn(
                "flex-1 py-2.5 rounded-xl bg-stone-800 text-amber-50 text-sm font-bold flex flex-row items-center justify-center gap-2",
                { hoverBgStone900: true, disabledOpacity50: createUserMutation.isPending || updateUserMutation.isPending || updatePasswordMutation.isPending }
              )}
            >
              {(createUserMutation.isPending ||
                updateUserMutation.isPending ||
                updatePasswordMutation.isPending) ? (
                <ActivityIndicator size="small" color="#fffbeb" />
              ) : editingUser ? (
                <Text style={cn("text-amber-50 text-sm font-bold")}>Salvar Alterações</Text>
              ) : (
                <Text style={cn("text-amber-50 text-sm font-bold")}>Criar Usuário</Text>
              )}
            </TouchableOpacity>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddressFormModalOpen} onOpenChange={setIsAddressFormModalOpen}>
        <DialogContent style={cn("sm:max-w-[520px] bg-card text-foreground rounded-2xl p-0 overflow-hidden")}>
          <View style={cn("px-6 pt-6 pb-4 border-b border-border/50 bg-stone-50/80")}>
            <DialogHeader>
              <DialogTitle style={cn("font-serif text-2xl font-bold text-foreground flex flex-row items-center gap-2")}>
                <MapPin size={20} color="#78716c" />
                <Text style={cn("text-foreground text-2xl font-bold")}>
                  {editingAddress ? "Editar Endereço" : "Novo Endereço"}
                </Text>
              </DialogTitle>
              <DialogDescription style={cn("text-stone-500 text-sm")}>
                {editingAddress
                  ? "Atualize os dados do endereço."
                  : "Preencha os dados do novo endereço."}
              </DialogDescription>
            </DialogHeader>
          </View>

          <ScrollView style={cn("px-6 py-5 max-h-[70vh]")} contentContainerStyle={cn("space-y-4")}>
            <View style={cn("space-y-1.5")}>
              <Text style={cn("text-xs font-black uppercase text-stone-500")}>Rua / Logradouro</Text>
              <TextInput
                value={addressForm.street}
                onChangeText={(text) => setAddressForm((p) => ({ ...p, street: text }))}
                placeholder="Ex: Rua das Flores"
                style={cn("rounded-xl border-stone-200 bg-background focus:ring-stone-300 px-3 py-2 text-foreground")}
                required
              />
            </View>

            <View style={cn("grid grid-cols-2 gap-4")}>
              <View style={cn("space-y-1.5")}>
                <Text style={cn("text-xs font-black uppercase text-stone-500")}>Número</Text>
                <TextInput
                  value={addressForm.number}
                  onChangeText={(text) => setAddressForm((p) => ({ ...p, number: text }))}
                  placeholder="Ex: 123"
                  style={cn("rounded-xl border-stone-200 bg-background focus:ring-stone-300 px-3 py-2 text-foreground")}
                  keyboardType="numeric"
                  required
                />
              </View>
              <View style={cn("space-y-1.5")}>
                <Text style={cn("text-xs font-black uppercase text-stone-500")}>Complemento</Text>
                <TextInput
                  value={addressForm.complement ?? ""}
                  onChangeText={(text) => setAddressForm((p) => ({ ...p, complement: text }))}
                  placeholder="Apto, bloco..."
                  style={cn("rounded-xl border-stone-200 bg-background focus:ring-stone-300 px-3 py-2 text-foreground")}
                />
              </View>
            </View>

            <View style={cn("grid grid-cols-3 gap-4")}>
              <View style={cn("space-y-1.5")}>
                <Text style={cn("text-xs font-black uppercase text-stone-500")}>CEP</Text>
                <TextInput
                  value={addressForm.cep}
                  onChangeText={(text) => setAddressForm((p) => ({ ...p, cep: text }))}
                  placeholder="00000-000"
                  style={cn("rounded-xl border-stone-200 bg-background focus:ring-stone-300 px-3 py-2 text-foreground")}
                  keyboardType="numeric"
                  required
                />
              </View>
              <View style={cn("space-y-1.5")}>
                <Text style={cn("text-xs font-black uppercase text-stone-500")}>Cidade</Text>
                <TextInput
                  value={addressForm.city}
                  onChangeText={(text) => setAddressForm((p) => ({ ...p, city: text }))}
                  placeholder="Ex: São Paulo"
                  style={cn("rounded-xl border-stone-200 bg-background focus:ring-stone-300 px-3 py-2 text-foreground")}
                  required
                />
              </View>
              <View style={cn("space-y-1.5")}>
                <Text style={cn("text-xs font-black uppercase text-stone-500")}>Estado</Text>
                <TextInput
                  value={addressForm.state}
                  onChangeText={(text) => setAddressForm((p) => ({ ...p, state: text }))}
                  placeholder="Ex: SP"
                  style={cn("rounded-xl border-stone-200 bg-background focus:ring-stone-300 px-3 py-2 text-foreground")}
                  required
                />
              </View>
            </View>

            <View style={cn("flex flex-row items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-4 py-3")}>
              <View>
                <Text style={cn("text-sm font-bold text-foreground flex flex-row items-center gap-1.5")}>
                  <Star size={14} color="#f59e0b" /> Endereço Padrão
                </Text>
                <Text style={cn("text-xs text-stone-500")}>Usar como endereço principal do usuário</Text>
              </View>
              <Switch
                checked={addressForm.isDefault}
                onCheckedChange={(v) => setAddressForm((p) => ({ ...p, isDefault: v }))}
              />
            </View>
          </ScrollView>

          <DialogFooter style={cn("pt-2 flex flex-row gap-3 px-6 pb-6")}>
            <TouchableOpacity
              onPress={closeAddressFormModal}
              style={cn(
                "flex-1 py-2.5 rounded-xl border border-stone-200 bg-background text-stone-700 text-sm font-bold",
                { hoverBgStone50: true }
              )}
            >
              <Text style={cn("text-stone-700 text-sm font-bold text-center")}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAddressSubmit}
              disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
              style={cn(
                "flex-1 py-2.5 rounded-xl bg-stone-800 text-amber-50 text-sm font-bold flex flex-row items-center justify-center gap-2",
                { hoverBgStone900: true, disabledOpacity50: createAddressMutation.isPending || updateAddressMutation.isPending }
              )}
            >
              {(createAddressMutation.isPending || updateAddressMutation.isPending) ? (
                <ActivityIndicator size="small" color="#fffbeb" />
              ) : editingAddress ? (
                <Text style={cn("text-amber-50 text-sm font-bold")}>Salvar Endereço</Text>
              ) : (
                <Text style={cn("text-amber-50 text-sm font-bold")}>Adicionar Endereço</Text>
              )}
            </TouchableOpacity>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SafeAreaView>
  );
};

export default UserManagement;