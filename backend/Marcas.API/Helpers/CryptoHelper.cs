using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace Marcas.API.Helpers;

public static class CryptoHelper
{
    public static string DecryptString(string cipherTextBase64, string sharedSecret)
    {
        if (string.IsNullOrEmpty(cipherTextBase64))
            return cipherTextBase64;

        byte[] fullCipher = Convert.FromBase64String(cipherTextBase64);

        if (fullCipher.Length <= 16)
            throw new ArgumentException("Cipher text is too short.");

        byte[] iv = new byte[16];
        byte[] cipher = new byte[fullCipher.Length - 16];

        Buffer.BlockCopy(fullCipher, 0, iv, 0, iv.Length);
        Buffer.BlockCopy(fullCipher, iv.Length, cipher, 0, cipher.Length);

        using (Aes aes = Aes.Create())
        {
            aes.Key = GetValidKey(sharedSecret);
            aes.IV = iv;
            ICryptoTransform decryptor = aes.CreateDecryptor(aes.Key, aes.IV);

            using (MemoryStream memoryStream = new MemoryStream(cipher))
            {
                using (CryptoStream cryptoStream = new CryptoStream((Stream)memoryStream, decryptor, CryptoStreamMode.Read))
                {
                    using (StreamReader streamReader = new StreamReader((Stream)cryptoStream))
                    {
                        return streamReader.ReadToEnd();
                    }
                }
            }
        }
    }

    private static byte[] GetValidKey(string sharedSecret)
    {
        // Use SHA256 to ensure a 32-byte key
        using (SHA256 sha256 = SHA256.Create())
        {
            return sha256.ComputeHash(Encoding.UTF8.GetBytes(sharedSecret));
        }
    }
}
