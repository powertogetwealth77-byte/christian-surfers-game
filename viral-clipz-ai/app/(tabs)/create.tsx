import { Redirect } from 'expo-router';

/**
 * The central tab button opens the create flow directly (see the custom
 * tabBarButton in _layout). This screen only exists to satisfy the route
 * and redirects if reached by deep link.
 */
export default function CreateTabRedirect() {
  return <Redirect href="/create/source" />;
}
