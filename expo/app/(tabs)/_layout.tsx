import { Tabs } from "expo-router";
import { Home, Calendar, MessageCircle, User } from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";
import { BlurView } from "expo-blur";
import { theme } from "@/constants/theme";
export default function TabLayout() {
  return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textTertiary,
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: Platform.OS === 'ios' ? 'transparent' : theme.colors.surface,
            borderTopWidth: 0,
            paddingTop: 12,
            paddingBottom: Platform.OS === 'ios' ? 32 : 12,
            paddingHorizontal: 20,
            height: Platform.OS === 'ios' ? 96 : 72,
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 8,
          },
          tabBarBackground: () => Platform.OS === 'ios' ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(20, 20, 22, 0.85)',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
              }}
            />
          ) : null,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600' as const,
            marginTop: 6,
            marginBottom: 2,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="(home)"
          options={{
            title: "Events",
            tabBarIcon: ({ color, focused }) => (
              <Home 
                size={focused ? 26 : 24} 
                color={color} 
                strokeWidth={focused ? 2.5 : 2}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            title: "Schedule",
            tabBarIcon: ({ color, focused }) => (
              <Calendar 
                size={focused ? 26 : 24} 
                color={color} 
                strokeWidth={focused ? 2.5 : 2}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ color, focused }) => (
              <MessageCircle 
                size={focused ? 26 : 24} 
                color={color} 
                strokeWidth={focused ? 2.5 : 2}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <User 
                size={focused ? 26 : 24} 
                color={color} 
                strokeWidth={focused ? 2.5 : 2}
              />
            ),
          }}
        />
      </Tabs>
  );
}