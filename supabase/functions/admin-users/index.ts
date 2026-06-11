// Supabase Edge Function: admin-users
// Permite ao admin criar/eliminar/mudar-password de utilizadores.
// Chama o Supabase Admin API com service_role key.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface CreatePayload { action: 'create'; email: string; password: string; full_name: string; role: 'admin' | 'user'; }
interface DeletePayload { action: 'delete'; userId: string; }
interface ChangePasswordPayload { action: 'change_password'; newPassword: string; }
interface ChangeRolePayload { action: 'change_role'; userId: string; role: 'admin' | 'user'; }

type Payload = CreatePayload | DeletePayload | ChangePasswordPayload | ChangeRolePayload;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Verificar que quem chama é admin
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response(JSON.stringify({ error: 'Sem token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const token = authHeader.replace('Bearer ', '');
  const { data: callerData, error: callerErr } = await supabaseAdmin.auth.getUser(token);
  if (callerErr || !callerData.user) return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const callerRole = (callerData.user.user_metadata as any)?.role || 'user';
  if (callerRole !== 'admin') return new Response(JSON.stringify({ error: 'Apenas admins' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const body: Payload = await req.json();
    if (body.action === 'create') {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: { full_name: body.full_name, role: body.role },
      });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, user_id: data.user.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (body.action === 'delete') {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(body.userId);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (body.action === 'change_password') {
      const { error } = await supabaseAdmin.auth.updateUserById(callerData.user.id, { password: body.newPassword });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (body.action === 'change_role') {
      // Atualizar user_metadata em auth.users (vai refletir em public.users via trigger)
      const { data: target, error: getErr } = await supabaseAdmin.auth.admin.getUserById(body.userId);
      if (getErr) throw getErr;
      const md = { ...(target.user.user_metadata || {}), role: body.role };
      const { error } = await supabaseAdmin.auth.admin.updateUserById(body.userId, { user_metadata: md });
      if (error) throw error;
      // Também atualizar em public.users
      await supabaseAdmin.from('users').update({ role: body.role }).eq('supabase_user_id', body.userId);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: 'Ação desconhecida' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Erro' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
