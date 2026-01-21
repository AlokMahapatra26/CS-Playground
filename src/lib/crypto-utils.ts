export async function generateKeyPair() {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );
    return keyPair;
}

export async function exportKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey(
        key.type === "public" ? "spki" : "pkcs8",
        key
    );
    const exportedAsBase64 = window.btoa(String.fromCharCode(...new Uint8Array(exported)));
    return `-----BEGIN ${key.type.toUpperCase()} KEY-----\n${exportedAsBase64}\n-----END ${key.type.toUpperCase()} KEY-----`;
}

export async function encryptMessage(message: string, publicKey: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: "RSA-OAEP",
        },
        publicKey,
        data
    );
    return window.btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

export async function decryptMessage(ciphertext: string, privateKey: CryptoKey): Promise<string> {
    try {
        const binaryString = window.atob(ciphertext);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: "RSA-OAEP",
            },
            privateKey,
            bytes
        );

        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (e) {
        console.error("Decryption failed", e);
        throw new Error("Decryption failed. Ensure you are using the correct private key.");
    }
}
