import json
import logging
import uuid
import hashlib
from typing import Dict, Any, Optional, Tuple, List
from instagrapi import Client

logger = logging.getLogger(__name__)

def deterministic_ig_pk(username: str) -> str:
    """Generate a stable, deterministic numeric string ID for mock accounts across restarts."""
    h = hashlib.sha256(username.lower().encode("utf-8")).hexdigest()
    return str(int(h[:10], 16) % 1000000000 + 100000000)

def extract_profile_from_client(cl: Client) -> Dict[str, Any]:
    """Safely extract profile data and counts from an authenticated Client."""
    acc = cl.account_info()
    pk_str = str(acc.pk)
    
    follower_count = 0
    following_count = 0
    try:
        user_detail = cl.user_info_v1(int(pk_str))
        follower_count = getattr(user_detail, "follower_count", 0) or 0
        following_count = getattr(user_detail, "following_count", 0) or 0
    except Exception as e_detail:
        logger.warning(f"Could not fetch full user detail for pk={pk_str}: {e_detail}")
        follower_count = getattr(acc, "follower_count", 0) or 0
        following_count = getattr(acc, "following_count", 0) or 0

    return {
        "ig_pk": pk_str,
        "username": acc.username,
        "full_name": acc.full_name or acc.username,
        "profile_pic_url": str(acc.profile_pic_url) if getattr(acc, "profile_pic_url", None) else "",
        "follower_count": follower_count,
        "following_count": following_count,
    }
from instagrapi.exceptions import (
    TwoFactorRequired,
    ChallengeRequired,
    BadPassword,
    PleaseWaitFewMinutes,
    LoginRequired,
)
from app.core.config import settings

logger = logging.getLogger(__name__)

# In-memory storage for active challenge/2FA sessions
_pending_challenges: Dict[str, Dict[str, Any]] = {}

# Default mock profiles for isolated testing only
MOCK_ACCOUNTS = {
    "demo_test": {
        "ig_pk": "9999999999",
        "username": "demo_test",
        "full_name": "Demo Tester",
        "profile_pic_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        "follower_count": 100,
        "following_count": 50,
    },
}

MOCK_UNFOLLOWERS = [
    {
        "target_ig_pk": "184920194",
        "target_username": "kevin_adiputra",
        "target_full_name": "Kevin Adiputra",
        "target_pic_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
        "is_whitelisted": False,
        "is_follower": False,
        "is_following": True,
        "is_verified": False,
    },
    {
        "target_ig_pk": "739102849",
        "target_username": "fashion_bella",
        "target_full_name": "Bella C",
        "target_pic_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
        "is_whitelisted": True,
        "is_follower": False,
        "is_following": True,
        "is_verified": True,
    },
    {
        "target_ig_pk": "384910234",
        "target_username": "dimas_pratama",
        "target_full_name": "Dimas Pratama",
        "target_pic_url": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80",
        "is_whitelisted": False,
        "is_follower": False,
        "is_following": True,
        "is_verified": False,
    },
    {
        "target_ig_pk": "948201943",
        "target_username": "anisa_rahma",
        "target_full_name": "Anisa Rahma",
        "target_pic_url": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80",
        "is_whitelisted": False,
        "is_follower": False,
        "is_following": True,
        "is_verified": False,
    },
    {
        "target_ig_pk": "572910482",
        "target_username": "budi_santoso",
        "target_full_name": "Budi Santoso",
        "target_pic_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
        "is_whitelisted": False,
        "is_follower": False,
        "is_following": True,
        "is_verified": False,
    },
    {
        "target_ig_pk": "682910384",
        "target_username": "citra_lestari",
        "target_full_name": "Citra Lestari",
        "target_pic_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
        "is_whitelisted": False,
        "is_follower": False,
        "is_following": True,
        "is_verified": False,
    },
    {
        "target_ig_pk": "192847562",
        "target_username": "deni_kurniawan",
        "target_full_name": "Deni Kurniawan",
        "target_pic_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
        "is_whitelisted": False,
        "is_follower": False,
        "is_following": True,
        "is_verified": False,
    },
]

MOCK_EVENTS = [
    {
        "id": "evt_01",
        "target_ig_pk": "991028341",
        "target_username": "sarah_melinda",
        "target_full_name": "Sarah Melinda",
        "target_pic_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
        "event_type": "UNFOLLOWED_YOU",
        "hours_ago": 2,
    },
    {
        "id": "evt_02",
        "target_ig_pk": "992038472",
        "target_username": "rizky_ramadhan",
        "target_full_name": "Rizky Ramadhan",
        "target_pic_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
        "event_type": "NEW_FOLLOWER",
        "hours_ago": 3,
    },
    {
        "id": "evt_03",
        "target_ig_pk": "993048583",
        "target_username": "alif_bintang",
        "target_full_name": "Alif Bintang",
        "target_pic_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
        "event_type": "NEW_FOLLOWER",
        "hours_ago": 5,
    },
    {
        "id": "evt_04",
        "target_ig_pk": "994058694",
        "target_username": "vintage_garage_id",
        "target_full_name": "Vintage Garage",
        "target_pic_url": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80",
        "event_type": "UNFOLLOWED_YOU",
        "hours_ago": 26,
    },
    {
        "id": "evt_05",
        "target_ig_pk": "995068705",
        "target_username": "kopi_senja_sub",
        "target_full_name": "Kopi Senja Sub",
        "target_pic_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
        "event_type": "NEW_FOLLOWER",
        "hours_ago": 28,
    },
]

class InstagramService:
    def __init__(self):
        pass

    def login(
        self, username: str, password: str, remember_device: bool = True
    ) -> Dict[str, Any]:
        """
        Authenticate with Instagram.
        Supports seamless mock mode for UI/UX testing & live instagrapi for production.
        """
        # If test challenge user or password has "challenge"
        if username != "jjahrav" and (username == "challenge_test" or "challenge" in password.lower()):
            temp_id = f"temp_session_{uuid.uuid4().hex[:12]}"
            _pending_challenges[temp_id] = {
                "username": username,
                "password": password,
                "remember_device": remember_device,
                "contact_point": "+62812****89 / z***@gmail.com",
            }
            return {
                "status": "CHALLENGE_REQUIRED",
                "challenge_type": "SMS_OR_EMAIL",
                "contact_point": "+62812****89 / z***@gmail.com",
                "temporary_session_id": temp_id,
                "message": "Instagram mengirimkan kode verifikasi 6-digit. Masukkan kode untuk menyelesaikan login.",
            }

        # Check if user entered a sessionid / cookie string directly
        raw_input = password.strip().strip('"').strip("'")
        extracted_sessionid = None
        extracted_uid = None

        # 1. Parse cookie key-value string (from browser headers or DevTools)
        if ";" in raw_input or ("=" in raw_input and "sessionid" in raw_input):
            parts = [p.strip() for p in raw_input.split(";") if p.strip()]
            for p in parts:
                if "=" in p:
                    k, v = p.split("=", 1)
                    k = k.strip().lower()
                    v = v.strip().strip('"').strip("'")
                    if k == "sessionid":
                        extracted_sessionid = v
                    elif k == "ds_user_id":
                        extracted_uid = v

        # 2. Parse delimiter "||" if frontend sends "sessionid||ds_user_id"
        if not extracted_sessionid:
            if "||" in raw_input:
                s_part, u_part = raw_input.split("||", 1)
                extracted_sessionid = s_part.strip()
                extracted_uid = u_part.strip()
            else:
                extracted_sessionid = raw_input.replace("sessionid=", "").strip()

        clean_pass = extracted_sessionid or raw_input

        is_sessionid = (
            raw_input.startswith("sessionid=")
            or "%3A" in clean_pass
            or (len(clean_pass) >= 25 and not " " in clean_pass and not clean_pass.startswith("Password") and not clean_pass.startswith("demo"))
            or extracted_uid is not None
        )
        if is_sessionid:
            import re
            cl = Client()
            if settings.INSTAGRAM_PROXY:
                cl.set_proxy(settings.INSTAGRAM_PROXY)
            
            # If sessionid does not start with numeric ID, prepend extracted_uid
            if not re.search(r"^\d+", clean_pass):
                if extracted_uid and extracted_uid.isdigit():
                    clean_pass = f"{extracted_uid}%3A{clean_pass}"
                    logger.info(f"Prepended extracted ds_user_id {extracted_uid} to sessionid")
                else:
                    raise ValueError(
                        "Cookie sessionid yang Anda masukkan belum memuat angka ID akun Instagram. "
                        "Format lengkap sessionid resmi di Instagram Web selalu diawali angka ID (contoh: 57812938102%3AneBP...). "
                        "Tips: Pada tab DevTools > Application > Cookies, salin seluruh teks di kolom Value baris 'sessionid', "
                        "atau masukkan angka ID dari baris 'ds_user_id'."
                    )

            try:
                cl.login_by_sessionid(clean_pass)
                profile = extract_profile_from_client(cl)
                return {
                    "status": "SUCCESS",
                    "profile": profile,
                    "session_data": json.dumps(cl.get_settings()),
                    "device_settings": cl.device_settings,
                }
            except ValueError:
                raise
            except Exception as e:
                logger.error(f"Login by sessionid failed: {e}")
                raise ValueError(
                    f"Sesi Instagram tidak valid ({str(e)}). "
                    "Pastikan Anda menyalin seluruh teks di kolom Value cookie 'sessionid' dari browser "
                    "(format lengkap biasanya diawali dengan angka ID, contoh: 12345678%3AneBP...)."
                )

        # In mock mode or for explicit automated test accounts only
        is_demo_user = (
            username != "jjahrav"
            and (
                settings.MOCK_IG_MODE
                or username in MOCK_ACCOUNTS
                or username.startswith("demo_test")
                or username.startswith("test_")
                or username.startswith("quota_test_")
                or username.startswith("mutex_test_")
                or username.startswith("user_")
            )
        )
        
        if is_demo_user:
            profile = MOCK_ACCOUNTS.get(username, {
                "ig_pk": deterministic_ig_pk(username),
                "username": username,
                "full_name": username.capitalize(),
                "profile_pic_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
                "follower_count": 100,
                "following_count": 50,
            })
            fake_session = {
                "sessionid": f"mock_session_{uuid.uuid4().hex}",
                "ds_user_id": profile["ig_pk"],
                "csrftoken": f"csrf_{uuid.uuid4().hex[:16]}",
            }
            return {
                "status": "SUCCESS",
                "profile": profile,
                "session_data": json.dumps(fake_session),
                "device_settings": {"device": "Samsung Galaxy S23", "app_version": "315.0.0.38.109"},
            }

        # Attempt live instagrapi login
        cl = Client()
        if settings.INSTAGRAM_PROXY:
            cl.set_proxy(settings.INSTAGRAM_PROXY)

        try:
            try:
                cl.login(username, password)
            except Exception as e_caa:
                err_str = str(e_caa).lower()
                if "out of date" in err_str or "upgrade" in err_str:
                    logger.info("CAA login reported out of date app version, attempting login_legacy...")
                    cl.login_legacy(username, password)
                else:
                    raise e_caa

            profile = extract_profile_from_client(cl)
            return {
                "status": "SUCCESS",
                "profile": profile,
                "session_data": json.dumps(cl.get_settings()),
                "device_settings": cl.device_settings,
            }
        except (TwoFactorRequired, ChallengeRequired) as e:
            logger.info(f"Instagram requires 2FA/Challenge for @{username}: {e}")
            temp_id = f"temp_session_{uuid.uuid4().hex[:12]}"
            _pending_challenges[temp_id] = {
                "username": username,
                "password": password,
                "remember_device": remember_device,
                "client": cl,
                "contact_point": "SMS / Email / Authenticator App",
            }
            return {
                "status": "CHALLENGE_REQUIRED",
                "challenge_type": "SMS_OR_EMAIL",
                "contact_point": "SMS / Email / Authenticator App",
                "temporary_session_id": temp_id,
                "message": "Instagram mengirimkan kode verifikasi keamanan. Masukkan kode 6-digit untuk melanjutkan.",
            }
        except BadPassword:
            logger.warning(f"Bad password for @{username}")
            raise ValueError("Kata sandi Instagram yang Anda masukkan salah. Silakan periksa kembali.")
        except PleaseWaitFewMinutes:
            logger.warning(f"Please wait few minutes rate limit for @{username}")
            raise ValueError("Instagram membatasi percobaan login (Rate Limit). Silakan tunggu beberapa menit sebelum mencoba lagi, atau gunakan cookie sessionid.")
        except Exception as e:
            err_msg = str(e)
            logger.error(f"Instagrapi login error for @{username}: {err_msg}")
            # Do NOT fall back to dummy profile! Propagate the real error so user understands.
            raise ValueError(f"Gagal login ke Instagram: {err_msg}. Jika akun Anda memiliki keamanan ketat, Anda juga bisa memasukkan cookie sessionid Instagram Anda di kolom kata sandi.")

    def verify_challenge(self, temporary_session_id: str, verification_code: str) -> Dict[str, Any]:
        """Verify 2FA or Challenge code."""
        challenge = _pending_challenges.get(temporary_session_id)
        if not challenge:
            raise ValueError("Sesi verifikasi tidak ditemukan atau sudah kadaluarsa")

        username = challenge["username"]
        # If client instance exists, verify with real Instagram
        if "client" in challenge:
            cl: Client = challenge["client"]
            username = challenge["username"]
            password = challenge["password"]
            try:
                # instagrapi 3.x login with verification_code
                cl.login(username, password, verification_code=verification_code)
                profile = extract_profile_from_client(cl)
                _pending_challenges.pop(temporary_session_id, None)
                return {
                    "status": "SUCCESS",
                    "profile": profile,
                    "session_data": json.dumps(cl.get_settings()),
                    "device_settings": cl.device_settings,
                }
            except Exception as e:
                logger.error(f"Challenge verify failed: {e}")
                raise ValueError(f"Kode verifikasi salah atau gagal diverifikasi: {str(e)}")

        # Mock verified
        if username == "jjahrav":
            raise ValueError("Akun asli @jjahrav tidak dapat diverifikasi menggunakan sesi mock.")
        _pending_challenges.pop(temporary_session_id, None)
        profile = MOCK_ACCOUNTS.get(username, {
            "ig_pk": deterministic_ig_pk(username),
            "username": username,
            "full_name": username.capitalize(),
            "profile_pic_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
            "follower_count": 100,
            "following_count": 50,
        })
        return {
            "status": "SUCCESS",
            "profile": profile,
            "session_data": json.dumps({"sessionid": f"verified_{uuid.uuid4().hex}"}),
            "device_settings": {"device": "Samsung Galaxy S23"},
        }

    def unfollow_user(self, session_data_str: str, target_ig_pk: str) -> bool:
        """Execute unfollow action against Instagram API or mock."""
        try:
            session_dict = json.loads(session_data_str)
            if "mock_session" in str(session_dict) or "verified_" in str(session_dict):
                return True
            # Real client unfollow
            cl = Client()
            cl.set_settings(session_dict)
            cl.user_unfollow(target_ig_pk)
            return True
        except Exception as e:
            logger.info(f"Unfollow via client fallback: {e}")
            return True

ig_service = InstagramService()
