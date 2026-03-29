import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Adicione esta linha abaixo para esconder a barra completamente
        tabBarStyle: { display: "none" }, 
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          // Se a barra está escondida, os ícones não aparecerão, 
          // mas é bom manter a definição da Screen.
        }}
      />
    </Tabs>
  );
}