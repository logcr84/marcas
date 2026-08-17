using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace Marcas.Agent.Worker.Services;

public static class CryptoHelper
{
    public static string EncryptString(string plainText, string sharedSecret)
    {
        if (string.IsNullOrEmpty(plainText))
            return plainText;

        byte[] iv = new byte[16];
        byte[] array;

        using (Aes aes = Aes.Create())
        {
            aes.Key = GetValidKey(sharedSecret);
            aes.IV = iv; // For simplicity, using empty IV (since we just need obfuscation in transit), or we can generate random IV. Let's use a zero IV for simplicity, but random is better.
            // Let's use a random IV and prepend it to the ciphertext
            aes.GenerateIV();
            iv = aes.IV;

            ICryptoTransform encryptor = aes.CreateEncryptor(aes.Key, aes.IV);

            using (MemoryStream memoryStream = new MemoryStream())
            {
                using (CryptoStream cryptoStream = new CryptoStream((Stream)memoryStream, encryptor, CryptoStreamMode.Write))
                {
                    using (StreamWriter streamWriter = new StreamWriter((Stream)cryptoStream))
                    {
                        streamWriter.Write(plainText);
                    }
                    array = memoryStream.ToArray();
                }
            }
        }

        // Combine IV and CipherText
        var result = new byte[iv.Length + array.Length];
        Buffer.BlockCopy(iv, 0, result, 0, iv.Length);
        Buffer.BlockCopy(array, 0, result, iv.Length, array.Length);

        return Convert.ToBase64String(result);
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
