import { APIGuild, APIRole } from "discord-api-types/v10";
export type DiscordOauthBundle = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
};
export type DiscordGuildData = {
  name: string;
  id: string;
  icon: string | null;
  roles: APIRole[];
};
