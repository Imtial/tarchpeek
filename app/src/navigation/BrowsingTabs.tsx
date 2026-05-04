import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../design/ThemeProvider';
import { ChannelsScreen } from '../screens/browsing/ChannelsScreen';
import { HomeScreen } from '../screens/browsing/HomeScreen';
import { PlaylistsScreen } from '../screens/browsing/PlaylistsScreen';
import { SearchScreen } from '../screens/browsing/SearchScreen';

type BrowsingTabParamList = {
  Home: undefined;
  Channels: undefined;
  Playlists: undefined;
  Search: undefined;
};

const Tab = createBottomTabNavigator<BrowsingTabParamList>();
const iconNameByRoute: Record<keyof BrowsingTabParamList, string> = {
  Home: 'home-outline',
  Channels: 'television-play',
  Playlists: 'playlist-play',
  Search: 'magnify',
};

function buildTabBarIcon(routeName: keyof BrowsingTabParamList) {
  return function TabBarIcon({ color, size }: { color: string; size: number }) {
    return <MaterialCommunityIcons color={color} name={iconNameByRoute[routeName]} size={size} />;
  };
}

function BrowsingTabs() {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => {
          return {
            headerShown: false,
            tabBarActiveTintColor: colors.accent,
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarStyle: {
              backgroundColor: colors.surfaceBackground,
              borderTopColor: colors.border,
            },
            tabBarIcon: buildTabBarIcon(route.name),
          };
        }}
      >
        <Tab.Screen component={HomeScreen} name="Home" />
        <Tab.Screen component={ChannelsScreen} name="Channels" />
        <Tab.Screen component={PlaylistsScreen} name="Playlists" />
        <Tab.Screen component={SearchScreen} name="Search" />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export { BrowsingTabs };
