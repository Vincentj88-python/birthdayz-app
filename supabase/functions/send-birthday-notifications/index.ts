import { createClient } from "https://esm.sh/@supabase/supabase-js@2.101.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FriendRow {
  id: string;
  user_id: string;
  name: string;
  birthday: string;
  relationship: string | null;
}

interface UserRow {
  id: string;
  display_name: string;
  push_token: string | null;
  language: string;
  timezone: string;
}

interface NotifPrefs {
  user_id: string;
  remind_7_days: boolean;
  remind_3_days: boolean;
  remind_1_day: boolean;
  remind_morning: boolean;
  reminder_time: string;
}

function getDaysUntilBirthday(birthday: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bday = new Date(birthday);
  const thisYear = today.getFullYear();

  let next = new Date(thisYear, bday.getMonth(), bday.getDate());
  next.setHours(0, 0, 0, 0);

  if (next < today) {
    next = new Date(thisYear + 1, bday.getMonth(), bday.getDate());
  }

  // Handle Feb 29 in non-leap years
  if (bday.getMonth() === 1 && bday.getDate() === 29) {
    const year = next.getFullYear();
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    if (!isLeap) {
      next = new Date(year, 2, 1);
    }
  }

  return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getAgeTurning(birthday: string): number {
  const bday = new Date(birthday);
  const thisYear = new Date().getFullYear();
  const age = thisYear - bday.getFullYear();
  // If birthday already passed this year, they'll turn age+1 next year
  const next = new Date(thisYear, bday.getMonth(), bday.getDate());
  return next < new Date() ? age + 1 : age;
}

function buildNotification(
  friendName: string,
  daysUntil: number,
  ageTurning: number,
  language: string
): { title: string; body: string } {
  const isAf = language === "af";

  if (daysUntil === 0) {
    return {
      title: isAf
        ? `${friendName} se verjaarsdag is vandag!`
        : `It's ${friendName}'s birthday today!`,
      body: isAf
        ? `${friendName} word ${ageTurning}. Stuur hulle 'n spesiale wens! \u{1F382}`
        : `${friendName} is turning ${ageTurning}. Send them a special wish! \u{1F382}`,
    };
  }

  if (daysUntil === 1) {
    return {
      title: isAf
        ? `${friendName} se verjaarsdag is m\u00f4re!`
        : `${friendName}'s birthday is tomorrow!`,
      body: isAf
        ? `Berei jou wens voor vir ${friendName} se ${ageTurning}ste verjaarsdag \u{1F381}`
        : `Get your wish ready for ${friendName}'s ${ageTurning}th birthday \u{1F381}`,
    };
  }

  return {
    title: isAf
      ? `${friendName} se verjaarsdag is oor ${daysUntil} dae`
      : `${friendName}'s birthday in ${daysUntil} days`,
    body: isAf
      ? `${friendName} word ${ageTurning} oor ${daysUntil} dae. Begin beplan! \u{1F4C5}`
      : `${friendName} is turning ${ageTurning} in ${daysUntil} days. Start planning! \u{1F4C5}`,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all friends with birthdays
    const { data: friends, error: friendsError } = await supabase
      .from("friends")
      .select("id, user_id, name, birthday, relationship")
      .not("birthday", "is", null);

    if (friendsError) throw friendsError;

    // Find friends with birthdays at notification thresholds
    const notificationQueue: {
      userId: string;
      friendName: string;
      daysUntil: number;
      ageTurning: number;
    }[] = [];

    for (const friend of friends as FriendRow[]) {
      const daysUntil = getDaysUntilBirthday(friend.birthday);
      if ([0, 1, 3, 7].includes(daysUntil)) {
        notificationQueue.push({
          userId: friend.user_id,
          friendName: friend.name,
          daysUntil,
          ageTurning: getAgeTurning(friend.birthday),
        });
      }
    }

    if (notificationQueue.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userIds = [...new Set(notificationQueue.map((n) => n.userId))];

    const [usersRes, prefsRes] = await Promise.all([
      supabase
        .from("users")
        .select("id, display_name, push_token, language, timezone")
        .in("id", userIds)
        .not("push_token", "is", null),
      supabase
        .from("notification_preferences")
        .select("*")
        .in("user_id", userIds),
    ]);

    if (usersRes.error) throw usersRes.error;
    if (prefsRes.error) throw prefsRes.error;

    const usersMap = new Map(
      (usersRes.data as UserRow[]).map((u) => [u.id, u])
    );
    const prefsMap = new Map(
      (prefsRes.data as NotifPrefs[]).map((p) => [p.user_id, p])
    );

    const messages: {
      to: string;
      title: string;
      body: string;
      data: Record<string, string>;
      sound: string;
    }[] = [];

    for (const notif of notificationQueue) {
      const user = usersMap.get(notif.userId);
      if (!user?.push_token) continue;

      const prefs = prefsMap.get(notif.userId);
      if (prefs) {
        if (notif.daysUntil === 7 && !prefs.remind_7_days) continue;
        if (notif.daysUntil === 3 && !prefs.remind_3_days) continue;
        if (notif.daysUntil === 1 && !prefs.remind_1_day) continue;
        if (notif.daysUntil === 0 && !prefs.remind_morning) continue;
      }

      const { title, body } = buildNotification(
        notif.friendName,
        notif.daysUntil,
        notif.ageTurning,
        user.language
      );

      messages.push({
        to: user.push_token,
        title,
        body,
        data: {
          friendName: notif.friendName,
          daysUntil: String(notif.daysUntil),
        },
        sound: "default",
      });
    }

    // Send via Expo Push API in batches of 100
    let sent = 0;
    for (let i = 0; i < messages.length; i += 100) {
      const batch = messages.slice(i, i + 100);
      const pushRes = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch),
      });

      if (pushRes.ok) {
        sent += batch.length;
      } else {
        console.error("Expo push error:", await pushRes.text());
      }
    }

    console.log(`Sent ${sent} notifications`);

    return new Response(JSON.stringify({ sent, total: messages.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Notification cron error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
