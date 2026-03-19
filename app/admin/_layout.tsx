// app/admin/_layout.tsx
import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="dashboard" options={{ title: "Dashboard Overview" }} />
      <Stack.Screen name="users" options={{ title: "Users" }} />
      <Stack.Screen name="categories" options={{ title: "Categories" }} />
      <Stack.Screen name="products" options={{ title: "Products" }} />
      <Stack.Screen name="orders" options={{ title: "Admin Orders" }} /> {/* Renomeie para evitar conflito */}
      <Stack.Screen name="reports" options={{ title: "Reports" }} />
      <Stack.Screen name="expenses" options={{ title: "Expense" }} />
    </Stack>
  );
}