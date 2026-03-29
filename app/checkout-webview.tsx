import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

export default function CheckoutWebViewScreen() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);

  if (!url) {
    router.replace("/orders");
    return null;
  }

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const currentUrl = navState.url;

    if (currentUrl.includes('grao-mestre-prime.vercel.app/order/success')) {
      queryClient.invalidateQueries({ queryKey: ["pendingOrder"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      
      router.replace({ 
        pathname: "/payment-status", 
        params: { status: 'success' } 
      });
    } 
    else if (currentUrl.includes('grao-mestre-prime.vercel.app/order/failure')) {
      router.replace({ 
        pathname: "/payment-status", 
        params: { status: 'failure' } 
      });
    } 
    else if (currentUrl.includes('grao-mestre-prime.vercel.app/order/pending')) {
      queryClient.invalidateQueries({ queryKey: ["pendingOrder"] });
      
      router.replace({ 
        pathname: "/payment-status", 
        params: { status: 'pending' } 
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {isLoading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#9a6333" />
        </View>
      )}
      <WebView
        source={{ uri: url }}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadEnd={() => setIsLoading(false)}
        startInLoadingState={true}
        style={styles.webview}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfbf9', 
  },
  webview: {
    flex: 1,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fdfbf9',
    zIndex: 10,
  }
});