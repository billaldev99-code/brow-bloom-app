-- Remove the overly permissive public read policy
DROP POLICY IF EXISTS "Anyone can view appointment slots" ON public.appointments;

-- Roles system
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only admins can view full appointment data
CREATE POLICY "Admins can view all appointments"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update appointments"
  ON public.appointments FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete appointments"
  ON public.appointments FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Public function: returns only booked date+time pairs (no PII)
CREATE OR REPLACE FUNCTION public.get_booked_slots(_date date)
RETURNS TABLE(appointment_time text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT appointment_time FROM public.appointments
  WHERE appointment_date = _date AND status <> 'cancelled'
$$;

GRANT EXECUTE ON FUNCTION public.get_booked_slots(date) TO anon, authenticated;