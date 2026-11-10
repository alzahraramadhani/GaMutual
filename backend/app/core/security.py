import base64
import hashlib
import json
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from jose import JWTError, jwt
from app.core.config import settings

def _get_derived_key() -> bytes:
    """Derive a 256-bit (32 bytes) key from settings.SECRET_KEY using SHA-256."""
    return hashlib.sha256(settings.SECRET_KEY.encode('utf-8')).digest()

def encrypt_data(plaintext: str) -> str:
    """Encrypt a string using AES-256-GCM and return a base64 string."""
    if not plaintext:
        return ""
    key = _get_derived_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # 96-bit nonce standard for GCM
    encrypted = aesgcm.encrypt(nonce, plaintext.encode('utf-8'), None)
    payload = nonce + encrypted
    return base64.b64encode(payload).decode('utf-8')

def decrypt_data(encrypted_b64: str) -> str:
    """Decrypt a base64 string encrypted with AES-256-GCM."""
    if not encrypted_b64:
        return ""
    try:
        raw_payload = base64.b64decode(encrypted_b64.encode('utf-8'))
        nonce = raw_payload[:12]
        ciphertext = raw_payload[12:]
        key = _get_derived_key()
        aesgcm = AESGCM(key)
        decrypted = aesgcm.decrypt(nonce, ciphertext, None)
        return decrypted.decode('utf-8')
    except Exception as e:
        raise ValueError(f"Decryption failed: {str(e)}")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None
