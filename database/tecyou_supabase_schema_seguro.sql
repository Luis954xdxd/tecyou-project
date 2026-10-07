-- TECYOU / SUPABASE - ESQUEMA SIN REGISTROS
-- Generado a partir de tecyou_schema_actualizado.sql (pg_dump PostgreSQL 17.4).
-- Usar SOLO en un proyecto Supabase NUEVO, con tablas public ausentes.
-- Conserva tablas, secuencias, constraints, indices y claves foraneas del original.
-- Habilita RLS en todas las tablas public, pero NO crea politicas RLS.
-- Con RLS y sin politicas, anon/authenticated no podran acceder por Data API.
-- El rol postgres del backend puede omitir RLS; mantenlo exclusivo del servidor.
-- Ejecutar una sola vez. No usar en bases que ya tengan estas tablas.
-- No incluye datos de PostgreSQL local ni integra public.users con auth.users.

BEGIN;

-- TOC entry 252 (class 1259 OID 34061)
-- Name: achievement_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.achievement_definitions (
    id integer NOT NULL,
    code character varying(100) NOT NULL,
    title character varying(150) NOT NULL,
    description text NOT NULL,
    icon character varying(50),
    category character varying(50) NOT NULL,
    rarity character varying(30) DEFAULT 'common'::character varying,
    condition_type character varying(50) NOT NULL,
    condition_value integer DEFAULT 1 NOT NULL,
    extra_condition jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 251 (class 1259 OID 34060)
-- Name: achievement_definitions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.achievement_definitions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5337 (class 0 OID 0)
-- Dependencies: 251
-- Name: achievement_definitions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.achievement_definitions_id_seq OWNED BY public.achievement_definitions.id;


--
-- TOC entry 275 (class 1259 OID 34800)
-- Name: admin_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_audit_logs (
    id integer NOT NULL,
    actor_user_id integer,
    action character varying(80) NOT NULL,
    target_type character varying(40) NOT NULL,
    target_id integer,
    reason text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 274 (class 1259 OID 34799)
-- Name: admin_audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5338 (class 0 OID 0)
-- Dependencies: 274
-- Name: admin_audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_audit_logs_id_seq OWNED BY public.admin_audit_logs.id;


--
-- TOC entry 260 (class 1259 OID 34138)
-- Name: avatar_frame_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.avatar_frame_definitions (
    id integer NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    image_url text,
    rarity character varying(30) NOT NULL,
    required_achievements_count integer DEFAULT 0,
    required_badges_count integer DEFAULT 0,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 259 (class 1259 OID 34137)
-- Name: avatar_frame_definitions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.avatar_frame_definitions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5339 (class 0 OID 0)
-- Dependencies: 259
-- Name: avatar_frame_definitions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.avatar_frame_definitions_id_seq OWNED BY public.avatar_frame_definitions.id;


--
-- TOC entry 256 (class 1259 OID 34096)
-- Name: badge_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.badge_definitions (
    id integer NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(150) NOT NULL,
    description text NOT NULL,
    image_url text,
    category character varying(50),
    rarity character varying(30) DEFAULT 'special'::character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 255 (class 1259 OID 34095)
-- Name: badge_definitions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.badge_definitions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5340 (class 0 OID 0)
-- Dependencies: 255
-- Name: badge_definitions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.badge_definitions_id_seq OWNED BY public.badge_definitions.id;


--
-- TOC entry 222 (class 1259 OID 24671)
-- Name: badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.badges (
    id integer NOT NULL,
    recognition_id integer,
    image_url text NOT NULL,
    prompt_used text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 221 (class 1259 OID 24670)
-- Name: badges_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.badges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5341 (class 0 OID 0)
-- Dependencies: 221
-- Name: badges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.badges_id_seq OWNED BY public.badges.id;


--
-- TOC entry 266 (class 1259 OID 34681)
-- Name: chat_conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_conversations (
    id integer NOT NULL,
    is_group boolean DEFAULT false NOT NULL,
    name character varying(120),
    direct_key character varying(80),
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    group_image_url text
);


--
-- TOC entry 265 (class 1259 OID 34680)
-- Name: chat_conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5342 (class 0 OID 0)
-- Dependencies: 265
-- Name: chat_conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_conversations_id_seq OWNED BY public.chat_conversations.id;


--
-- TOC entry 280 (class 1259 OID 34898)
-- Name: chat_message_mentions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_message_mentions (
    message_id integer NOT NULL,
    mentioned_user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 282 (class 1259 OID 34933)
-- Name: chat_message_reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_message_reactions (
    message_id integer NOT NULL,
    user_id integer NOT NULL,
    reaction_type character varying(30) DEFAULT 'love'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 269 (class 1259 OID 34715)
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    conversation_id integer,
    sender_id integer,
    content text,
    message_type character varying(20) DEFAULT 'text'::character varying,
    media_url text,
    media_mime character varying(120),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    moderation_status character varying(30) DEFAULT 'visible'::character varying
);


--
-- TOC entry 268 (class 1259 OID 34714)
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5343 (class 0 OID 0)
-- Dependencies: 268
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- TOC entry 267 (class 1259 OID 34697)
-- Name: chat_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_participants (
    conversation_id integer NOT NULL,
    user_id integer NOT NULL,
    last_read_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 238 (class 1259 OID 32968)
-- Name: comment_mentions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comment_mentions (
    id integer NOT NULL,
    comment_id integer NOT NULL,
    mentioned_user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 237 (class 1259 OID 32967)
-- Name: comment_mentions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comment_mentions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5344 (class 0 OID 0)
-- Dependencies: 237
-- Name: comment_mentions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comment_mentions_id_seq OWNED BY public.comment_mentions.id;


--
-- TOC entry 234 (class 1259 OID 24813)
-- Name: comment_replies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comment_replies (
    id integer NOT NULL,
    comment_id integer NOT NULL,
    user_id integer NOT NULL,
    reply text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 233 (class 1259 OID 24812)
-- Name: comment_replies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comment_replies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5345 (class 0 OID 0)
-- Dependencies: 233
-- Name: comment_replies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comment_replies_id_seq OWNED BY public.comment_replies.id;


--
-- TOC entry 277 (class 1259 OID 34816)
-- Name: content_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_reports (
    id integer NOT NULL,
    reporter_user_id integer,
    target_type character varying(40) NOT NULL,
    target_id integer NOT NULL,
    reason character varying(80) NOT NULL,
    details text,
    status character varying(30) DEFAULT 'pending'::character varying,
    reviewed_by integer,
    reviewed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    resolution_note text
);


--
-- TOC entry 276 (class 1259 OID 34815)
-- Name: content_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.content_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5346 (class 0 OID 0)
-- Dependencies: 276
-- Name: content_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.content_reports_id_seq OWNED BY public.content_reports.id;


--
-- TOC entry 286 (class 1259 OID 35004)
-- Name: institutional_challenge_completions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.institutional_challenge_completions (
    id integer NOT NULL,
    challenge_id integer NOT NULL,
    user_id integer NOT NULL,
    recognition_id integer,
    evidence_url text NOT NULL,
    evidence_type character varying(10) NOT NULL,
    points_awarded integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 285 (class 1259 OID 35003)
-- Name: institutional_challenge_completions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.institutional_challenge_completions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5347 (class 0 OID 0)
-- Dependencies: 285
-- Name: institutional_challenge_completions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.institutional_challenge_completions_id_seq OWNED BY public.institutional_challenge_completions.id;


--
-- TOC entry 284 (class 1259 OID 34987)
-- Name: institutional_challenges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.institutional_challenges (
    id integer NOT NULL,
    creator_id integer NOT NULL,
    content text NOT NULL,
    points integer NOT NULL,
    media_url text,
    media_type character varying(10),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT institutional_challenges_points_check CHECK ((points > 0))
);


--
-- TOC entry 283 (class 1259 OID 34986)
-- Name: institutional_challenges_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.institutional_challenges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5348 (class 0 OID 0)
-- Dependencies: 283
-- Name: institutional_challenges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.institutional_challenges_id_seq OWNED BY public.institutional_challenges.id;


--
-- TOC entry 228 (class 1259 OID 24754)
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    actor_id integer,
    type character varying(50) NOT NULL,
    title character varying(150) NOT NULL,
    content text,
    reference_id integer,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notifications_type_check CHECK (((type)::text = ANY ((ARRAY['new_follower'::character varying, 'recognition_received'::character varying, 'reaction_received'::character varying, 'comment_received'::character varying, 'comment_reply_received'::character varying, 'mention_received'::character varying, 'story_mention'::character varying, 'favorite_received'::character varying, 'chat_message'::character varying, 'report_updated'::character varying, 'institutional_challenge'::character varying])::text[])))
);


--
-- TOC entry 227 (class 1259 OID 24753)
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5349 (class 0 OID 0)
-- Dependencies: 227
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- TOC entry 273 (class 1259 OID 34766)
-- Name: recognition_comment_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recognition_comment_likes (
    id integer NOT NULL,
    comment_id integer,
    user_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 272 (class 1259 OID 34765)
-- Name: recognition_comment_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recognition_comment_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5350 (class 0 OID 0)
-- Dependencies: 272
-- Name: recognition_comment_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recognition_comment_likes_id_seq OWNED BY public.recognition_comment_likes.id;


--
-- TOC entry 230 (class 1259 OID 24776)
-- Name: recognition_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recognition_comments (
    id integer NOT NULL,
    recognition_id integer NOT NULL,
    user_id integer NOT NULL,
    comment text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    parent_comment_id integer,
    moderation_status character varying(30) DEFAULT 'visible'::character varying
);


--
-- TOC entry 229 (class 1259 OID 24775)
-- Name: recognition_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recognition_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5351 (class 0 OID 0)
-- Dependencies: 229
-- Name: recognition_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recognition_comments_id_seq OWNED BY public.recognition_comments.id;


--
-- TOC entry 240 (class 1259 OID 32990)
-- Name: recognition_favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recognition_favorites (
    id integer NOT NULL,
    user_id integer NOT NULL,
    recognition_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 239 (class 1259 OID 32989)
-- Name: recognition_favorites_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recognition_favorites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5352 (class 0 OID 0)
-- Dependencies: 239
-- Name: recognition_favorites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recognition_favorites_id_seq OWNED BY public.recognition_favorites.id;


--
-- TOC entry 232 (class 1259 OID 24798)
-- Name: recognition_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recognition_images (
    id integer NOT NULL,
    recognition_id integer NOT NULL,
    image_url text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 231 (class 1259 OID 24797)
-- Name: recognition_images_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recognition_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5353 (class 0 OID 0)
-- Dependencies: 231
-- Name: recognition_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recognition_images_id_seq OWNED BY public.recognition_images.id;


--
-- TOC entry 236 (class 1259 OID 32947)
-- Name: recognition_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recognition_media (
    id integer NOT NULL,
    recognition_id integer NOT NULL,
    media_url text NOT NULL,
    media_type character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT recognition_media_media_type_check CHECK (((media_type)::text = ANY ((ARRAY['image'::character varying, 'video'::character varying])::text[])))
);


--
-- TOC entry 235 (class 1259 OID 32946)
-- Name: recognition_media_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recognition_media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5354 (class 0 OID 0)
-- Dependencies: 235
-- Name: recognition_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recognition_media_id_seq OWNED BY public.recognition_media.id;


--
-- TOC entry 224 (class 1259 OID 24712)
-- Name: recognition_reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recognition_reactions (
    id integer NOT NULL,
    recognition_id integer NOT NULL,
    user_id integer NOT NULL,
    reaction_type character varying(30) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT recognition_reactions_reaction_type_check CHECK (((reaction_type)::text = ANY ((ARRAY['like'::character varying, 'celebrate'::character varying, 'inspire'::character varying, 'love'::character varying])::text[])))
);


--
-- TOC entry 223 (class 1259 OID 24711)
-- Name: recognition_reactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recognition_reactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5355 (class 0 OID 0)
-- Dependencies: 223
-- Name: recognition_reactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recognition_reactions_id_seq OWNED BY public.recognition_reactions.id;


--
-- TOC entry 271 (class 1259 OID 34742)
-- Name: recognition_reposts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recognition_reposts (
    id integer NOT NULL,
    user_id integer,
    recognition_id integer,
    comment text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 270 (class 1259 OID 34741)
-- Name: recognition_reposts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recognition_reposts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5356 (class 0 OID 0)
-- Dependencies: 270
-- Name: recognition_reposts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recognition_reposts_id_seq OWNED BY public.recognition_reposts.id;


--
-- TOC entry 220 (class 1259 OID 24651)
-- Name: recognitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recognitions (
    id integer NOT NULL,
    sender_id integer,
    receiver_id integer,
    message text NOT NULL,
    ai_refined_message text,
    category character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ai_category character varying(100),
    ai_sentiment character varying(50),
    ai_intensity character varying(50),
    ai_tags text[],
    ai_badge_title character varying(255),
    ai_badge_prompt text,
    ai_badge_image_url text,
    moderation_status character varying(30) DEFAULT 'visible'::character varying,
    moderated_at timestamp without time zone,
    moderated_by integer
);


--
-- TOC entry 219 (class 1259 OID 24650)
-- Name: recognitions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recognitions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5357 (class 0 OID 0)
-- Dependencies: 219
-- Name: recognitions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recognitions_id_seq OWNED BY public.recognitions.id;


--
-- TOC entry 242 (class 1259 OID 33013)
-- Name: stories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stories (
    id integer NOT NULL,
    user_id integer NOT NULL,
    media_url text NOT NULL,
    media_type character varying(20) NOT NULL,
    text_content text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone NOT NULL,
    caption text,
    music_name character varying(255),
    music_url text,
    music_start_seconds integer DEFAULT 0,
    duration_seconds integer DEFAULT 5,
    visibility_type character varying(30) DEFAULT 'public'::character varying,
    moderation_status character varying(30) DEFAULT 'visible'::character varying,
    music_lyrics text,
    media_fit character varying(20) DEFAULT 'cover'::character varying,
    media_position_x integer DEFAULT 50,
    media_position_y integer DEFAULT 50,
    show_lyrics boolean DEFAULT true,
    lyrics_position_x integer DEFAULT 50,
    lyrics_position_y integer DEFAULT 76,
    CONSTRAINT stories_media_type_check CHECK (((media_type)::text = ANY ((ARRAY['image'::character varying, 'video'::character varying])::text[]))),
    CONSTRAINT stories_visibility_type_check CHECK (((visibility_type)::text = ANY ((ARRAY['public'::character varying, 'only_selected'::character varying, 'exclude_selected'::character varying])::text[])))
);


--
-- TOC entry 241 (class 1259 OID 33012)
-- Name: stories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5358 (class 0 OID 0)
-- Dependencies: 241
-- Name: stories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stories_id_seq OWNED BY public.stories.id;


--
-- TOC entry 250 (class 1259 OID 33095)
-- Name: story_audience_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.story_audience_rules (
    id integer NOT NULL,
    story_id integer NOT NULL,
    target_user_id integer NOT NULL,
    rule_type character varying(20) NOT NULL,
    CONSTRAINT story_audience_rules_rule_type_check CHECK (((rule_type)::text = ANY ((ARRAY['allow'::character varying, 'exclude'::character varying])::text[])))
);


--
-- TOC entry 249 (class 1259 OID 33094)
-- Name: story_audience_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.story_audience_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5359 (class 0 OID 0)
-- Dependencies: 249
-- Name: story_audience_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.story_audience_rules_id_seq OWNED BY public.story_audience_rules.id;


--
-- TOC entry 248 (class 1259 OID 33075)
-- Name: story_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.story_comments (
    id integer NOT NULL,
    story_id integer NOT NULL,
    user_id integer NOT NULL,
    comment text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 247 (class 1259 OID 33074)
-- Name: story_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.story_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5360 (class 0 OID 0)
-- Dependencies: 247
-- Name: story_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.story_comments_id_seq OWNED BY public.story_comments.id;


--
-- TOC entry 281 (class 1259 OID 34914)
-- Name: story_mentions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.story_mentions (
    story_id integer NOT NULL,
    mentioned_user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 244 (class 1259 OID 33034)
-- Name: story_reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.story_reactions (
    id integer NOT NULL,
    story_id integer NOT NULL,
    user_id integer NOT NULL,
    reaction_type character varying(30) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT story_reactions_reaction_type_check CHECK (((reaction_type)::text = ANY ((ARRAY['like'::character varying, 'love'::character varying, 'laugh'::character varying, 'wow'::character varying, 'sad'::character varying, 'fire'::character varying])::text[])))
);


--
-- TOC entry 243 (class 1259 OID 33033)
-- Name: story_reactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.story_reactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5361 (class 0 OID 0)
-- Dependencies: 243
-- Name: story_reactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.story_reactions_id_seq OWNED BY public.story_reactions.id;


--
-- TOC entry 246 (class 1259 OID 33055)
-- Name: story_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.story_views (
    id integer NOT NULL,
    story_id integer NOT NULL,
    viewer_id integer NOT NULL,
    viewed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 245 (class 1259 OID 33054)
-- Name: story_views_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.story_views_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5362 (class 0 OID 0)
-- Dependencies: 245
-- Name: story_views_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.story_views_id_seq OWNED BY public.story_views.id;


--
-- TOC entry 254 (class 1259 OID 34076)
-- Name: user_achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_achievements (
    id integer NOT NULL,
    user_id integer NOT NULL,
    achievement_id integer NOT NULL,
    unlocked_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    source_type character varying(50),
    source_id integer
);


--
-- TOC entry 253 (class 1259 OID 34075)
-- Name: user_achievements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_achievements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5363 (class 0 OID 0)
-- Dependencies: 253
-- Name: user_achievements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_achievements_id_seq OWNED BY public.user_achievements.id;


--
-- TOC entry 262 (class 1259 OID 34154)
-- Name: user_avatar_frames; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_avatar_frames (
    id integer NOT NULL,
    user_id integer NOT NULL,
    frame_id integer NOT NULL,
    unlocked_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_equipped boolean DEFAULT false
);


--
-- TOC entry 261 (class 1259 OID 34153)
-- Name: user_avatar_frames_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_avatar_frames_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5364 (class 0 OID 0)
-- Dependencies: 261
-- Name: user_avatar_frames_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_avatar_frames_id_seq OWNED BY public.user_avatar_frames.id;


--
-- TOC entry 258 (class 1259 OID 34110)
-- Name: user_badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_badges (
    id integer NOT NULL,
    user_id integer NOT NULL,
    badge_id integer NOT NULL,
    assigned_by_user_id integer NOT NULL,
    reason text,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 257 (class 1259 OID 34109)
-- Name: user_badges_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_badges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5365 (class 0 OID 0)
-- Dependencies: 257
-- Name: user_badges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_badges_id_seq OWNED BY public.user_badges.id;


--
-- TOC entry 279 (class 1259 OID 34857)
-- Name: user_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_blocks (
    id integer NOT NULL,
    blocker_id integer NOT NULL,
    blocked_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_blocks_check CHECK ((blocker_id <> blocked_id))
);


--
-- TOC entry 278 (class 1259 OID 34856)
-- Name: user_blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5366 (class 0 OID 0)
-- Dependencies: 278
-- Name: user_blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_blocks_id_seq OWNED BY public.user_blocks.id;


--
-- TOC entry 226 (class 1259 OID 24733)
-- Name: user_follows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_follows (
    id integer NOT NULL,
    follower_id integer NOT NULL,
    following_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_follows_check CHECK ((follower_id <> following_id))
);


--
-- TOC entry 225 (class 1259 OID 24732)
-- Name: user_follows_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_follows_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5367 (class 0 OID 0)
-- Dependencies: 225
-- Name: user_follows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_follows_id_seq OWNED BY public.user_follows.id;


--
-- TOC entry 287 (class 1259 OID 35030)
-- Name: user_reward_points; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_reward_points (
    user_id integer NOT NULL,
    total_points integer DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 264 (class 1259 OID 34175)
-- Name: user_reward_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_reward_status (
    id integer NOT NULL,
    user_id integer NOT NULL,
    achievements_count integer DEFAULT 0,
    badges_count integer DEFAULT 0,
    current_reward_tier character varying(50),
    is_reward_eligible boolean DEFAULT false,
    reward_claimed boolean DEFAULT false,
    reward_claimed_at timestamp without time zone,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 263 (class 1259 OID 34174)
-- Name: user_reward_status_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_reward_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5368 (class 0 OID 0)
-- Dependencies: 263
-- Name: user_reward_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_reward_status_id_seq OWNED BY public.user_reward_status.id;


--
-- TOC entry 218 (class 1259 OID 24640)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    fullname character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    role character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    display_name character varying(100),
    bio text,
    profile_image_url text,
    tags text[],
    cover_image_url text,
    birth_date date,
    location character varying(120),
    is_verified boolean DEFAULT false,
    password_hash text,
    system_role character varying(30) DEFAULT 'user'::character varying,
    account_status character varying(30) DEFAULT 'active'::character varying,
    suspended_until timestamp without time zone,
    last_login_at timestamp without time zone,
    moderation_status character varying(30) DEFAULT 'visible'::character varying,
    profile_visibility character varying(20) DEFAULT 'public'::character varying NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['student'::character varying, 'teacher'::character varying, 'staff'::character varying])::text[])))
);


--
-- TOC entry 217 (class 1259 OID 24639)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5369 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4928 (class 2604 OID 34064)
-- Name: achievement_definitions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievement_definitions ALTER COLUMN id SET DEFAULT nextval('public.achievement_definitions_id_seq'::regclass);


--
-- TOC entry 4970 (class 2604 OID 34803)
-- Name: admin_audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_logs ALTER COLUMN id SET DEFAULT nextval('public.admin_audit_logs_id_seq'::regclass);


--
-- TOC entry 4941 (class 2604 OID 34141)
-- Name: avatar_frame_definitions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avatar_frame_definitions ALTER COLUMN id SET DEFAULT nextval('public.avatar_frame_definitions_id_seq'::regclass);


--
-- TOC entry 4935 (class 2604 OID 34099)
-- Name: badge_definitions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_definitions ALTER COLUMN id SET DEFAULT nextval('public.badge_definitions_id_seq'::regclass);


--
-- TOC entry 4886 (class 2604 OID 24674)
-- Name: badges id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badges ALTER COLUMN id SET DEFAULT nextval('public.badges_id_seq'::regclass);


--
-- TOC entry 4956 (class 2604 OID 34684)
-- Name: chat_conversations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations ALTER COLUMN id SET DEFAULT nextval('public.chat_conversations_id_seq'::regclass);


--
-- TOC entry 4962 (class 2604 OID 34718)
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- TOC entry 4904 (class 2604 OID 32971)
-- Name: comment_mentions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_mentions ALTER COLUMN id SET DEFAULT nextval('public.comment_mentions_id_seq'::regclass);


--
-- TOC entry 4900 (class 2604 OID 24816)
-- Name: comment_replies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_replies ALTER COLUMN id SET DEFAULT nextval('public.comment_replies_id_seq'::regclass);


--
-- TOC entry 4973 (class 2604 OID 34819)
-- Name: content_reports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_reports ALTER COLUMN id SET DEFAULT nextval('public.content_reports_id_seq'::regclass);


--
-- TOC entry 4985 (class 2604 OID 35007)
-- Name: institutional_challenge_completions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institutional_challenge_completions ALTER COLUMN id SET DEFAULT nextval('public.institutional_challenge_completions_id_seq'::regclass);


--
-- TOC entry 4982 (class 2604 OID 34990)
-- Name: institutional_challenges id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institutional_challenges ALTER COLUMN id SET DEFAULT nextval('public.institutional_challenges_id_seq'::regclass);


--
-- TOC entry 4892 (class 2604 OID 24757)
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- TOC entry 4968 (class 2604 OID 34769)
-- Name: recognition_comment_likes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_comment_likes ALTER COLUMN id SET DEFAULT nextval('public.recognition_comment_likes_id_seq'::regclass);


--
-- TOC entry 4895 (class 2604 OID 24779)
-- Name: recognition_comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_comments ALTER COLUMN id SET DEFAULT nextval('public.recognition_comments_id_seq'::regclass);


--
-- TOC entry 4906 (class 2604 OID 32993)
-- Name: recognition_favorites id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_favorites ALTER COLUMN id SET DEFAULT nextval('public.recognition_favorites_id_seq'::regclass);


--
-- TOC entry 4898 (class 2604 OID 24801)
-- Name: recognition_images id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_images ALTER COLUMN id SET DEFAULT nextval('public.recognition_images_id_seq'::regclass);


--
-- TOC entry 4902 (class 2604 OID 32950)
-- Name: recognition_media id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_media ALTER COLUMN id SET DEFAULT nextval('public.recognition_media_id_seq'::regclass);


--
-- TOC entry 4888 (class 2604 OID 24715)
-- Name: recognition_reactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_reactions ALTER COLUMN id SET DEFAULT nextval('public.recognition_reactions_id_seq'::regclass);


--
-- TOC entry 4966 (class 2604 OID 34745)
-- Name: recognition_reposts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_reposts ALTER COLUMN id SET DEFAULT nextval('public.recognition_reposts_id_seq'::regclass);


--
-- TOC entry 4883 (class 2604 OID 24654)
-- Name: recognitions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognitions ALTER COLUMN id SET DEFAULT nextval('public.recognitions_id_seq'::regclass);


--
-- TOC entry 4908 (class 2604 OID 33016)
-- Name: stories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stories ALTER COLUMN id SET DEFAULT nextval('public.stories_id_seq'::regclass);


--
-- TOC entry 4927 (class 2604 OID 33098)
-- Name: story_audience_rules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_audience_rules ALTER COLUMN id SET DEFAULT nextval('public.story_audience_rules_id_seq'::regclass);


--
-- TOC entry 4925 (class 2604 OID 33078)
-- Name: story_comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_comments ALTER COLUMN id SET DEFAULT nextval('public.story_comments_id_seq'::regclass);


--
-- TOC entry 4921 (class 2604 OID 33037)
-- Name: story_reactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_reactions ALTER COLUMN id SET DEFAULT nextval('public.story_reactions_id_seq'::regclass);


--
-- TOC entry 4923 (class 2604 OID 33058)
-- Name: story_views id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_views ALTER COLUMN id SET DEFAULT nextval('public.story_views_id_seq'::regclass);


--
-- TOC entry 4933 (class 2604 OID 34079)
-- Name: user_achievements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements ALTER COLUMN id SET DEFAULT nextval('public.user_achievements_id_seq'::regclass);


--
-- TOC entry 4947 (class 2604 OID 34157)
-- Name: user_avatar_frames id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_avatar_frames ALTER COLUMN id SET DEFAULT nextval('public.user_avatar_frames_id_seq'::regclass);


--
-- TOC entry 4939 (class 2604 OID 34113)
-- Name: user_badges id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges ALTER COLUMN id SET DEFAULT nextval('public.user_badges_id_seq'::regclass);


--
-- TOC entry 4976 (class 2604 OID 34860)
-- Name: user_blocks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_blocks ALTER COLUMN id SET DEFAULT nextval('public.user_blocks_id_seq'::regclass);


--
-- TOC entry 4890 (class 2604 OID 24736)
-- Name: user_follows id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_follows ALTER COLUMN id SET DEFAULT nextval('public.user_follows_id_seq'::regclass);


--
-- TOC entry 4950 (class 2604 OID 34178)
-- Name: user_reward_status id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_reward_status ALTER COLUMN id SET DEFAULT nextval('public.user_reward_status_id_seq'::regclass);


--
-- TOC entry 4876 (class 2604 OID 24643)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5051 (class 2606 OID 34074)
-- Name: achievement_definitions achievement_definitions_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievement_definitions
    ADD CONSTRAINT achievement_definitions_code_key UNIQUE (code);


--
-- TOC entry 5053 (class 2606 OID 34072)
-- Name: achievement_definitions achievement_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievement_definitions
    ADD CONSTRAINT achievement_definitions_pkey PRIMARY KEY (id);


--
-- TOC entry 5101 (class 2606 OID 34809)
-- Name: admin_audit_logs admin_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5069 (class 2606 OID 34152)
-- Name: avatar_frame_definitions avatar_frame_definitions_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avatar_frame_definitions
    ADD CONSTRAINT avatar_frame_definitions_code_key UNIQUE (code);


--
-- TOC entry 5071 (class 2606 OID 34150)
-- Name: avatar_frame_definitions avatar_frame_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avatar_frame_definitions
    ADD CONSTRAINT avatar_frame_definitions_pkey PRIMARY KEY (id);


--
-- TOC entry 5061 (class 2606 OID 34108)
-- Name: badge_definitions badge_definitions_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_definitions
    ADD CONSTRAINT badge_definitions_code_key UNIQUE (code);


--
-- TOC entry 5063 (class 2606 OID 34106)
-- Name: badge_definitions badge_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_definitions
    ADD CONSTRAINT badge_definitions_pkey PRIMARY KEY (id);


--
-- TOC entry 5007 (class 2606 OID 24679)
-- Name: badges badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_pkey PRIMARY KEY (id);


--
-- TOC entry 5085 (class 2606 OID 34691)
-- Name: chat_conversations chat_conversations_direct_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_direct_key_key UNIQUE (direct_key);


--
-- TOC entry 5087 (class 2606 OID 34689)
-- Name: chat_conversations chat_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_pkey PRIMARY KEY (id);


--
-- TOC entry 5111 (class 2606 OID 34903)
-- Name: chat_message_mentions chat_message_mentions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_message_mentions
    ADD CONSTRAINT chat_message_mentions_pkey PRIMARY KEY (message_id, mentioned_user_id);


--
-- TOC entry 5115 (class 2606 OID 34939)
-- Name: chat_message_reactions chat_message_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_message_reactions
    ADD CONSTRAINT chat_message_reactions_pkey PRIMARY KEY (message_id, user_id);


--
-- TOC entry 5091 (class 2606 OID 34724)
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 5089 (class 2606 OID 34703)
-- Name: chat_participants chat_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_pkey PRIMARY KEY (conversation_id, user_id);


--
-- TOC entry 5027 (class 2606 OID 32976)
-- Name: comment_mentions comment_mentions_comment_id_mentioned_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_mentions
    ADD CONSTRAINT comment_mentions_comment_id_mentioned_user_id_key UNIQUE (comment_id, mentioned_user_id);


--
-- TOC entry 5029 (class 2606 OID 32974)
-- Name: comment_mentions comment_mentions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_mentions
    ADD CONSTRAINT comment_mentions_pkey PRIMARY KEY (id);


--
-- TOC entry 5023 (class 2606 OID 24821)
-- Name: comment_replies comment_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_replies
    ADD CONSTRAINT comment_replies_pkey PRIMARY KEY (id);


--
-- TOC entry 5103 (class 2606 OID 34825)
-- Name: content_reports content_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_reports
    ADD CONSTRAINT content_reports_pkey PRIMARY KEY (id);


--
-- TOC entry 5119 (class 2606 OID 35014)
-- Name: institutional_challenge_completions institutional_challenge_completions_challenge_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institutional_challenge_completions
    ADD CONSTRAINT institutional_challenge_completions_challenge_id_user_id_key UNIQUE (challenge_id, user_id);


--
-- TOC entry 5121 (class 2606 OID 35012)
-- Name: institutional_challenge_completions institutional_challenge_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institutional_challenge_completions
    ADD CONSTRAINT institutional_challenge_completions_pkey PRIMARY KEY (id);


--
-- TOC entry 5117 (class 2606 OID 34997)
-- Name: institutional_challenges institutional_challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institutional_challenges
    ADD CONSTRAINT institutional_challenges_pkey PRIMARY KEY (id);


--
-- TOC entry 5017 (class 2606 OID 24764)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 5097 (class 2606 OID 34774)
-- Name: recognition_comment_likes recognition_comment_likes_comment_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_comment_likes
    ADD CONSTRAINT recognition_comment_likes_comment_id_user_id_key UNIQUE (comment_id, user_id);


--
-- TOC entry 5099 (class 2606 OID 34772)
-- Name: recognition_comment_likes recognition_comment_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_comment_likes
    ADD CONSTRAINT recognition_comment_likes_pkey PRIMARY KEY (id);


--
-- TOC entry 5019 (class 2606 OID 24784)
-- Name: recognition_comments recognition_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_comments
    ADD CONSTRAINT recognition_comments_pkey PRIMARY KEY (id);


--
-- TOC entry 5031 (class 2606 OID 32996)
-- Name: recognition_favorites recognition_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_favorites
    ADD CONSTRAINT recognition_favorites_pkey PRIMARY KEY (id);


--
-- TOC entry 5033 (class 2606 OID 32998)
-- Name: recognition_favorites recognition_favorites_user_id_recognition_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_favorites
    ADD CONSTRAINT recognition_favorites_user_id_recognition_id_key UNIQUE (user_id, recognition_id);


--
-- TOC entry 5021 (class 2606 OID 24806)
-- Name: recognition_images recognition_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_images
    ADD CONSTRAINT recognition_images_pkey PRIMARY KEY (id);


--
-- TOC entry 5025 (class 2606 OID 32956)
-- Name: recognition_media recognition_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_media
    ADD CONSTRAINT recognition_media_pkey PRIMARY KEY (id);


--
-- TOC entry 5009 (class 2606 OID 24719)
-- Name: recognition_reactions recognition_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_reactions
    ADD CONSTRAINT recognition_reactions_pkey PRIMARY KEY (id);


--
-- TOC entry 5011 (class 2606 OID 24721)
-- Name: recognition_reactions recognition_reactions_recognition_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_reactions
    ADD CONSTRAINT recognition_reactions_recognition_id_user_id_key UNIQUE (recognition_id, user_id);


--
-- TOC entry 5093 (class 2606 OID 34750)
-- Name: recognition_reposts recognition_reposts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_reposts
    ADD CONSTRAINT recognition_reposts_pkey PRIMARY KEY (id);


--
-- TOC entry 5095 (class 2606 OID 34752)
-- Name: recognition_reposts recognition_reposts_user_id_recognition_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_reposts
    ADD CONSTRAINT recognition_reposts_user_id_recognition_id_key UNIQUE (user_id, recognition_id);


--
-- TOC entry 5005 (class 2606 OID 24659)
-- Name: recognitions recognitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognitions
    ADD CONSTRAINT recognitions_pkey PRIMARY KEY (id);


--
-- TOC entry 5035 (class 2606 OID 33023)
-- Name: stories stories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_pkey PRIMARY KEY (id);


--
-- TOC entry 5047 (class 2606 OID 33101)
-- Name: story_audience_rules story_audience_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_audience_rules
    ADD CONSTRAINT story_audience_rules_pkey PRIMARY KEY (id);


--
-- TOC entry 5049 (class 2606 OID 33103)
-- Name: story_audience_rules story_audience_rules_story_id_target_user_id_rule_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_audience_rules
    ADD CONSTRAINT story_audience_rules_story_id_target_user_id_rule_type_key UNIQUE (story_id, target_user_id, rule_type);


--
-- TOC entry 5045 (class 2606 OID 33083)
-- Name: story_comments story_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_comments
    ADD CONSTRAINT story_comments_pkey PRIMARY KEY (id);


--
-- TOC entry 5113 (class 2606 OID 34919)
-- Name: story_mentions story_mentions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_mentions
    ADD CONSTRAINT story_mentions_pkey PRIMARY KEY (story_id, mentioned_user_id);


--
-- TOC entry 5037 (class 2606 OID 33041)
-- Name: story_reactions story_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_reactions
    ADD CONSTRAINT story_reactions_pkey PRIMARY KEY (id);


--
-- TOC entry 5039 (class 2606 OID 33043)
-- Name: story_reactions story_reactions_story_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_reactions
    ADD CONSTRAINT story_reactions_story_id_user_id_key UNIQUE (story_id, user_id);


--
-- TOC entry 5041 (class 2606 OID 33061)
-- Name: story_views story_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_views
    ADD CONSTRAINT story_views_pkey PRIMARY KEY (id);


--
-- TOC entry 5043 (class 2606 OID 33063)
-- Name: story_views story_views_story_id_viewer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_views
    ADD CONSTRAINT story_views_story_id_viewer_id_key UNIQUE (story_id, viewer_id);


--
-- TOC entry 5057 (class 2606 OID 34082)
-- Name: user_achievements user_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_pkey PRIMARY KEY (id);


--
-- TOC entry 5059 (class 2606 OID 34084)
-- Name: user_achievements user_achievements_user_id_achievement_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_user_id_achievement_id_key UNIQUE (user_id, achievement_id);


--
-- TOC entry 5076 (class 2606 OID 34161)
-- Name: user_avatar_frames user_avatar_frames_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_avatar_frames
    ADD CONSTRAINT user_avatar_frames_pkey PRIMARY KEY (id);


--
-- TOC entry 5078 (class 2606 OID 34163)
-- Name: user_avatar_frames user_avatar_frames_user_id_frame_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_avatar_frames
    ADD CONSTRAINT user_avatar_frames_user_id_frame_id_key UNIQUE (user_id, frame_id);


--
-- TOC entry 5065 (class 2606 OID 34118)
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (id);


--
-- TOC entry 5067 (class 2606 OID 34120)
-- Name: user_badges user_badges_user_id_badge_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_badge_id_key UNIQUE (user_id, badge_id);


--
-- TOC entry 5107 (class 2606 OID 34866)
-- Name: user_blocks user_blocks_blocker_id_blocked_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT user_blocks_blocker_id_blocked_id_key UNIQUE (blocker_id, blocked_id);


--
-- TOC entry 5109 (class 2606 OID 34864)
-- Name: user_blocks user_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT user_blocks_pkey PRIMARY KEY (id);


--
-- TOC entry 5013 (class 2606 OID 24742)
-- Name: user_follows user_follows_follower_id_following_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_follower_id_following_id_key UNIQUE (follower_id, following_id);


--
-- TOC entry 5015 (class 2606 OID 24740)
-- Name: user_follows user_follows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_pkey PRIMARY KEY (id);


--
-- TOC entry 5123 (class 2606 OID 35036)
-- Name: user_reward_points user_reward_points_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_reward_points
    ADD CONSTRAINT user_reward_points_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5081 (class 2606 OID 34185)
-- Name: user_reward_status user_reward_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_reward_status
    ADD CONSTRAINT user_reward_status_pkey PRIMARY KEY (id);


--
-- TOC entry 5083 (class 2606 OID 34187)
-- Name: user_reward_status user_reward_status_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_reward_status
    ADD CONSTRAINT user_reward_status_user_id_key UNIQUE (user_id);


--
-- TOC entry 5001 (class 2606 OID 24649)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5003 (class 2606 OID 24647)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5054 (class 1259 OID 34678)
-- Name: idx_user_achievements_achievement_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_achievements_achievement_id ON public.user_achievements USING btree (achievement_id);


--
-- TOC entry 5055 (class 1259 OID 34677)
-- Name: idx_user_achievements_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_achievements_user_id ON public.user_achievements USING btree (user_id);


--
-- TOC entry 5072 (class 1259 OID 34676)
-- Name: idx_user_avatar_frames_frame_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_avatar_frames_frame_id ON public.user_avatar_frames USING btree (frame_id);


--
-- TOC entry 5073 (class 1259 OID 34674)
-- Name: idx_user_avatar_frames_one_equipped; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_avatar_frames_one_equipped ON public.user_avatar_frames USING btree (user_id) WHERE (is_equipped = true);


--
-- TOC entry 5074 (class 1259 OID 34675)
-- Name: idx_user_avatar_frames_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_avatar_frames_user_id ON public.user_avatar_frames USING btree (user_id);


--
-- TOC entry 5104 (class 1259 OID 34878)
-- Name: idx_user_blocks_blocked; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_blocks_blocked ON public.user_blocks USING btree (blocked_id);


--
-- TOC entry 5105 (class 1259 OID 34877)
-- Name: idx_user_blocks_blocker; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_blocks_blocker ON public.user_blocks USING btree (blocker_id);


--
-- TOC entry 5079 (class 1259 OID 34679)
-- Name: idx_user_reward_status_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_reward_status_user_id ON public.user_reward_status USING btree (user_id);


--
-- TOC entry 5171 (class 2606 OID 34810)
-- Name: admin_audit_logs admin_audit_logs_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5127 (class 2606 OID 24680)
-- Name: badges badges_recognition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_recognition_id_fkey FOREIGN KEY (recognition_id) REFERENCES public.recognitions(id);


--
-- TOC entry 5162 (class 2606 OID 34692)
-- Name: chat_conversations chat_conversations_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5176 (class 2606 OID 34909)
-- Name: chat_message_mentions chat_message_mentions_mentioned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_message_mentions
    ADD CONSTRAINT chat_message_mentions_mentioned_user_id_fkey FOREIGN KEY (mentioned_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5177 (class 2606 OID 34904)
-- Name: chat_message_mentions chat_message_mentions_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_message_mentions
    ADD CONSTRAINT chat_message_mentions_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages(id) ON DELETE CASCADE;


--
-- TOC entry 5180 (class 2606 OID 34940)
-- Name: chat_message_reactions chat_message_reactions_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_message_reactions
    ADD CONSTRAINT chat_message_reactions_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages(id) ON DELETE CASCADE;


--
-- TOC entry 5181 (class 2606 OID 34945)
-- Name: chat_message_reactions chat_message_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_message_reactions
    ADD CONSTRAINT chat_message_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5165 (class 2606 OID 34725)
-- Name: chat_messages chat_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;


--
-- TOC entry 5166 (class 2606 OID 34730)
-- Name: chat_messages chat_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5163 (class 2606 OID 34704)
-- Name: chat_participants chat_participants_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;


--
-- TOC entry 5164 (class 2606 OID 34709)
-- Name: chat_participants chat_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5141 (class 2606 OID 32977)
-- Name: comment_mentions comment_mentions_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_mentions
    ADD CONSTRAINT comment_mentions_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.recognition_comments(id) ON DELETE CASCADE;


--
-- TOC entry 5142 (class 2606 OID 32982)
-- Name: comment_mentions comment_mentions_mentioned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_mentions
    ADD CONSTRAINT comment_mentions_mentioned_user_id_fkey FOREIGN KEY (mentioned_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5138 (class 2606 OID 24822)
-- Name: comment_replies comment_replies_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_replies
    ADD CONSTRAINT comment_replies_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.recognition_comments(id) ON DELETE CASCADE;


--
-- TOC entry 5139 (class 2606 OID 24827)
-- Name: comment_replies comment_replies_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comment_replies
    ADD CONSTRAINT comment_replies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5172 (class 2606 OID 34826)
-- Name: content_reports content_reports_reporter_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_reports
    ADD CONSTRAINT content_reports_reporter_user_id_fkey FOREIGN KEY (reporter_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5173 (class 2606 OID 34831)
-- Name: content_reports content_reports_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_reports
    ADD CONSTRAINT content_reports_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5183 (class 2606 OID 35015)
-- Name: institutional_challenge_completions institutional_challenge_completions_challenge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institutional_challenge_completions
    ADD CONSTRAINT institutional_challenge_completions_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.institutional_challenges(id) ON DELETE CASCADE;


--
-- TOC entry 5184 (class 2606 OID 35025)
-- Name: institutional_challenge_completions institutional_challenge_completions_recognition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institutional_challenge_completions
    ADD CONSTRAINT institutional_challenge_completions_recognition_id_fkey FOREIGN KEY (recognition_id) REFERENCES public.recognitions(id) ON DELETE SET NULL;


--
-- TOC entry 5185 (class 2606 OID 35020)
-- Name: institutional_challenge_completions institutional_challenge_completions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institutional_challenge_completions
    ADD CONSTRAINT institutional_challenge_completions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5182 (class 2606 OID 34998)
-- Name: institutional_challenges institutional_challenges_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.institutional_challenges
    ADD CONSTRAINT institutional_challenges_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5132 (class 2606 OID 24770)
-- Name: notifications notifications_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5133 (class 2606 OID 24765)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5169 (class 2606 OID 34775)
-- Name: recognition_comment_likes recognition_comment_likes_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_comment_likes
    ADD CONSTRAINT recognition_comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.recognition_comments(id) ON DELETE CASCADE;


--
-- TOC entry 5170 (class 2606 OID 34780)
-- Name: recognition_comment_likes recognition_comment_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_comment_likes
    ADD CONSTRAINT recognition_comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5134 (class 2606 OID 32962)
-- Name: recognition_comments recognition_comments_parent_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_comments
    ADD CONSTRAINT recognition_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.recognition_comments(id) ON DELETE CASCADE;


--
-- TOC entry 5135 (class 2606 OID 24785)
-- Name: recognition_comments recognition_comments_recognition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_comments
    ADD CONSTRAINT recognition_comments_recognition_id_fkey FOREIGN KEY (recognition_id) REFERENCES public.recognitions(id) ON DELETE CASCADE;


--
-- TOC entry 5136 (class 2606 OID 24790)
-- Name: recognition_comments recognition_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_comments
    ADD CONSTRAINT recognition_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5143 (class 2606 OID 33004)
-- Name: recognition_favorites recognition_favorites_recognition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_favorites
    ADD CONSTRAINT recognition_favorites_recognition_id_fkey FOREIGN KEY (recognition_id) REFERENCES public.recognitions(id) ON DELETE CASCADE;


--
-- TOC entry 5144 (class 2606 OID 32999)
-- Name: recognition_favorites recognition_favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_favorites
    ADD CONSTRAINT recognition_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5137 (class 2606 OID 24807)
-- Name: recognition_images recognition_images_recognition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_images
    ADD CONSTRAINT recognition_images_recognition_id_fkey FOREIGN KEY (recognition_id) REFERENCES public.recognitions(id) ON DELETE CASCADE;


--
-- TOC entry 5140 (class 2606 OID 32957)
-- Name: recognition_media recognition_media_recognition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_media
    ADD CONSTRAINT recognition_media_recognition_id_fkey FOREIGN KEY (recognition_id) REFERENCES public.recognitions(id) ON DELETE CASCADE;


--
-- TOC entry 5128 (class 2606 OID 24722)
-- Name: recognition_reactions recognition_reactions_recognition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_reactions
    ADD CONSTRAINT recognition_reactions_recognition_id_fkey FOREIGN KEY (recognition_id) REFERENCES public.recognitions(id) ON DELETE CASCADE;


--
-- TOC entry 5129 (class 2606 OID 24727)
-- Name: recognition_reactions recognition_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_reactions
    ADD CONSTRAINT recognition_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5167 (class 2606 OID 34758)
-- Name: recognition_reposts recognition_reposts_recognition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_reposts
    ADD CONSTRAINT recognition_reposts_recognition_id_fkey FOREIGN KEY (recognition_id) REFERENCES public.recognitions(id) ON DELETE CASCADE;


--
-- TOC entry 5168 (class 2606 OID 34753)
-- Name: recognition_reposts recognition_reposts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognition_reposts
    ADD CONSTRAINT recognition_reposts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5124 (class 2606 OID 34839)
-- Name: recognitions recognitions_moderated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognitions
    ADD CONSTRAINT recognitions_moderated_by_fkey FOREIGN KEY (moderated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5125 (class 2606 OID 24665)
-- Name: recognitions recognitions_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognitions
    ADD CONSTRAINT recognitions_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id);


--
-- TOC entry 5126 (class 2606 OID 24660)
-- Name: recognitions recognitions_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recognitions
    ADD CONSTRAINT recognitions_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- TOC entry 5145 (class 2606 OID 33024)
-- Name: stories stories_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stories
    ADD CONSTRAINT stories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5152 (class 2606 OID 33104)
-- Name: story_audience_rules story_audience_rules_story_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_audience_rules
    ADD CONSTRAINT story_audience_rules_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;


--
-- TOC entry 5153 (class 2606 OID 33109)
-- Name: story_audience_rules story_audience_rules_target_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_audience_rules
    ADD CONSTRAINT story_audience_rules_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5150 (class 2606 OID 33084)
-- Name: story_comments story_comments_story_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_comments
    ADD CONSTRAINT story_comments_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;


--
-- TOC entry 5151 (class 2606 OID 33089)
-- Name: story_comments story_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_comments
    ADD CONSTRAINT story_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5178 (class 2606 OID 34925)
-- Name: story_mentions story_mentions_mentioned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_mentions
    ADD CONSTRAINT story_mentions_mentioned_user_id_fkey FOREIGN KEY (mentioned_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5179 (class 2606 OID 34920)
-- Name: story_mentions story_mentions_story_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_mentions
    ADD CONSTRAINT story_mentions_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;


--
-- TOC entry 5146 (class 2606 OID 33044)
-- Name: story_reactions story_reactions_story_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_reactions
    ADD CONSTRAINT story_reactions_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;


--
-- TOC entry 5147 (class 2606 OID 33049)
-- Name: story_reactions story_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_reactions
    ADD CONSTRAINT story_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5148 (class 2606 OID 33064)
-- Name: story_views story_views_story_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_views
    ADD CONSTRAINT story_views_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;


--
-- TOC entry 5149 (class 2606 OID 33069)
-- Name: story_views story_views_viewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.story_views
    ADD CONSTRAINT story_views_viewer_id_fkey FOREIGN KEY (viewer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5154 (class 2606 OID 34090)
-- Name: user_achievements user_achievements_achievement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievement_definitions(id) ON DELETE CASCADE;


--
-- TOC entry 5155 (class 2606 OID 34085)
-- Name: user_achievements user_achievements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5159 (class 2606 OID 34169)
-- Name: user_avatar_frames user_avatar_frames_frame_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_avatar_frames
    ADD CONSTRAINT user_avatar_frames_frame_id_fkey FOREIGN KEY (frame_id) REFERENCES public.avatar_frame_definitions(id) ON DELETE CASCADE;


--
-- TOC entry 5160 (class 2606 OID 34164)
-- Name: user_avatar_frames user_avatar_frames_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_avatar_frames
    ADD CONSTRAINT user_avatar_frames_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5156 (class 2606 OID 34131)
-- Name: user_badges user_badges_assigned_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_assigned_by_user_id_fkey FOREIGN KEY (assigned_by_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5157 (class 2606 OID 34126)
-- Name: user_badges user_badges_badge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badge_definitions(id) ON DELETE CASCADE;


--
-- TOC entry 5158 (class 2606 OID 34121)
-- Name: user_badges user_badges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5174 (class 2606 OID 34872)
-- Name: user_blocks user_blocks_blocked_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT user_blocks_blocked_id_fkey FOREIGN KEY (blocked_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5175 (class 2606 OID 34867)
-- Name: user_blocks user_blocks_blocker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_blocks
    ADD CONSTRAINT user_blocks_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5130 (class 2606 OID 24743)
-- Name: user_follows user_follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5131 (class 2606 OID 24748)
-- Name: user_follows user_follows_following_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_follows
    ADD CONSTRAINT user_follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5186 (class 2606 OID 35037)
-- Name: user_reward_points user_reward_points_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_reward_points
    ADD CONSTRAINT user_reward_points_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5161 (class 2606 OID 34188)
-- Name: user_reward_status user_reward_status_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_reward_status
    ADD CONSTRAINT user_reward_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Seguridad: habilitar Row Level Security sin abrir acceso a clientes.
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatar_frame_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutional_challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutional_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognition_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognition_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognition_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognition_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognition_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognition_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognition_reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_audience_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_avatar_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reward_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reward_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

COMMIT;
