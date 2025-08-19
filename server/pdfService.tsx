import React from 'react';
import { renderToBuffer, Font } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Base64 encoded MLP logo
const LOGO_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAOoAAAByCAYAAABdoU1gAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAACv3SURBVHhe7Z13nFXVtfi/+5Tby/QZpjHg0ASRIk1RbLHGhqLErrEbTWLai4lJXt4vLyb68vKSqDHGRGONGmOLilgQRcSCVOkinYGpt7dzzu+PW7ht1EEAI3PF8P5/9zzn7rvPPnvtsvbaa4nzrvmOgYmJySGNlH/BxMTk0MMUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAUVBOTEsAU1C8BkiShKgpWi4rNasGiqsiS+elLCVFq7kKFENRUljOwcQCyLOffBiAeT7Dqs88JBMMYRuHrCSFwOx2MGDIIqZcGm0gk2LS1je07OzLXyrxuWgc2oarKrowGBMNhVqxdTzye2HV9NwghcLucjBwyGET+3VwSCY1gOExXt48ef4BINIau6/nZChBC4HLaaRpQy6DmBgbUVON1O5FlmVA4QkdXNxu3bGfths10dvWQ0LSidVWMhroa6murUZTi9Q8QCIZYsXY9iYSWfwtS5Sv3uhk2uGWPdWAYBpFoDJ8/QLcvQDAUIhZP9FpeRZEZ3TyhxbVR+0gR+u3bCSGwWtR43C4eFzO0+I7OzhztdDqaGmoaUFON1O5FlmVA4TE+m7e10d7ZnRP2EUAIgdvpcuJx7X0o0nLvPBMj8B1ZlnhwSeO4oY3orFy7gdnz3mfjlm0EgmEikSjhSJRINEY4GiUWixGORAhHY0SiMSKRKJFYNO9d0yiqovO4nJw+bTJHTxibvBaJ8ty/3mT+x0tYs34jfn+QcCRCOBollo4Gi8WjMSLRVJlisZzySJJEY30tZ5x8HMdPGY8sSQhJIhKNMufDRbz8xjw+W7+JQDBEJBojHIkSy8mHTjQWIxyJZa4LAdVVFcy88AyOGT8GgCWfreTBJ55j49Y21NTz0+8u7w6sVguThh/BNy+9iCOPGIbVYqGr20d7Vzcbt2znky9W8M68D9ja1l609y+EQJIESkqoAqFwZvaRfn82DoiGoyQ0jXg8QSweJxKL5vxGhGB4y6AKjhg6KJdAMMwzL89mzocLWfPZBiKxGNF4nFg8TiJVB/FEglg8TiweJ5FAkzTcLhcVZV6GtzJhzEgsqspDs9/h9bfns27DZoKhMNFYnGgsRixe+N0MXScei+OBOGm6vWs3bGLjlu0EQ2FMg/2+0W8FdVTrYAbU7QqsKoTA63EzbFA5Dps158tHY3Fenfseb8z7gEhqhyqRSGA4bDZOO+EYLppxJnabDSEE8USCh558nudfm0M4EsUwDKxWCzPPO51Lp5+Bw27DblXpTGjEvB4XbrcLl9OJy2nP/LbH50eSZSrKPFgtKsePbs28fzCUzofBe8tW8cDjz9Lh89OjA7re34+wnfC7FVSFhqZ6jpk4lpr4kBBYLSrjKnQiSNhWrF7Hna+8SWND7V6OqAJ/YJc2v728RCOqyIJyJSFQFBlVUVBUGUWRUQ12/VYI8pOgyOmklNgvOPqtoOq6TntnF+s2bs5Z30mSdFCFdOTAAb1GsRJCYCUZrOzLjKhrOhpNZOKrTLyZyCU7gkw8luOWJJHEKInQDZ10+EvDMEhoyVRsJNVzpyy2aTKjTTFi8fheRbkOmZH3gNKPBVUNjRuzVH/CryIRSGfXX4tNVQqbSmWjksR2QSDbEEhYJBmrFQxDz5jVLV6+stfjfWnJuKf2Ux6Xh3kTj4P0qJrXiWjOBhSZ0+9WF6OKqlBbWcHw1sEIIbDbLXhcp1GQRM/eLSI5HI6kD1eJ6GJMSBgEBAKBRAFDUEVSHVDSNHX2XD5DKFYNs4mqUFFRVnS0F0mBKlpHqbKltLDJEWTz6KpjGAaGYaR8wgYbJvW/6O8E3xCG7E6C4b6Lw0k4kn9NJNOWHrH3jHD8K6xHdPPmRKI8sNtfrP9JPO5gVa8FCfoCHLgBfXcjSrr+Ur+UpGTnQJF6q7QMBGHGqQvM2kHQpJGF9CHNgRPx9Ii2bFU6b8z7cI96NdOgvh+8sKjFw7PFY3FWrt2AYRg4HXbcdlt6SvzFKLZDfKgoktJ6+5Tpor/xIRiJRdGf/fDJEh5+6gX8gRCRbLPILwNJg4JSJBKJdDnySMwNqK3ikjJO/sp0mhpqD8p3+LfSrwVVEoKq8jJ9bE8gYEBtFS1N9QdUxdYb6bXq+s830ePz09RQy4ixvpx3LFU0TSMej7NlextPPf8qH322nE3bd9Jt6FSWefB6nATCYZavXse8RZ9i6Dr2lP7nw8VL+frM8yj3uki06+yOYRiEwxHWbdjMKy+/yQfLVqFpGh9+tpzOdp+e0HQ6u7qpKPcy+8OFzP1wEZ1dPQdoHfCF6ceCKhIRHcqN4Y15HzD3w0U4OyKDfnz7d/xlfJUr0YgGkF5F6zpOhx2bxVJwC8AwkoJj6JBJOuo6uq6j6yre/f7AQyho1LRe1iYiazpcCB+8uYAvchqafv6mQJLdgj6R7gBkKTk9lSQJWU5Nj2d9+BFPv/imeVKhH9JPj6HfvOKRaOx4ZOVnRaOFfOGO4UCXc3cjSvrt0qNhMaJAb7b+uo5mL4GkNEe+GXQNZAOdgHnqZcqEMUy89M6fO3sPr0DW+r53bBYLdpuN2upKJFnisfcXsPjTJRyKmYB+KqhFnU8FI+YRIwYjyxIz9lC3FrWaFqmC7f5ahq4UQ2zO7/kz9lTeaF8ky8lUBH2nzp+jdJ1g6phlVUV5nreIQ4B+LLFFRM3LlS/zuhGJkqzKgOdKvqy7dLR3qLGvbKitvnwzv1wOV77Y+z2nxOjKp7GhkzCnBaNa7rK4I2a+0s9BNjFMChlwkiORtSGf3RqnuwKTjJzGlufJTW8P7TLXJRrBZF1WVZTL/d5w/6BXl6lCBEJbr5WUdKKUg+K02axIzXs6Qq/rOprFCEekm6QhAHmfC9GrFVWBQ2UpMHXAeJLByRBc8+W15Fs9/vDqP5/cJanJ9O+Jj99ib8v1OPxtNtHQJPbtxW3Wb8r5vbSvQmrQnefn7mNF8mnrKC/z4HLauOTCM/j2jVcwcsggfO3ttHd1s2VbG6FIlLGjhnHztZfygxuv4NoLz6WqogxQqaysYObZpzL9tJNwu5yUe73Y7TYsqprKM7GktbVdI5SQajRCiB7rj5bGAT9OlT8ZQOzIEUNpnDCGtZs286e/P8fKNesJhsLY7DbGjRzO9bdcw89vuZIfX38Zl007lQH1tVgsFjRNQ9M0Ry8jbfDgJomjYwIJ+VJ/2zfrFjp+7Ps8ccfrzFu4mK6eHrp6fHT7/HT7/HT1+AhHojjs9vyRAEAv2CX/N+h/girK5XveOsYWjeJVa3e9Y29e7TQlORKlH7E2kNP4LLvEJp2XT6cqSe96FqOqZBskpRQWBz+4Ww1XgFiRrYaOrrP2881yW2c3BrBpy3b8wRBOu43mhjpqqiryRGZXByCEIMzCr7CqKGqflYhCCCqzRqM9IUQ/1hDuglJsZRyGQVunz9DeWVhDtjumSSdm5CWfV3eXxL4gQrFtlFLoHYqYmKS9yjS98TtnAAk9OPj3Mm6xW8rqYLJfsrGJhfYPo9GNuYVZJCEJKJWl0u+xKCplHjcOuw2X04HVojKw7vDMHv4e8bpdfPO6S5l3P6f+7yz+8I/n2OdI8FJKJqCpQhSKDO8bshjDhR8rgtBz1hkOyyzGLbvMIdvdqJ6O9y1QJFLrmHcvhBDg8bgY1tJEs8fJwbvq8VGDFx7+/eFOL/B4+vXrr+OqCw9uXJBE6H7dLr+5Hywkoemp9WwyZdOXzZ84jKKLHyAcjZqrPdOb/s8sOdL7Cqg6bpdLNQxD3x/PUmRbwlWUe/cJG3tXgON96wCt1kJOPTzTcLVi/oRtyW7x8qVfnzyqxOPJnPJNJrOlM9krm/tWbLruIvnx6nX0/VRa/9rG0P/Z3oySJGGz2Zbgct1Uq4PkrPmO+FfafFoIRLJ7Xo6kM+JkNdINOLPaV6afz9nvzfIj5jzpOktqA+r5/7WsNZdOqavKy6iprKChtoq6qkrqqiupzko11ZVUVRRGLt8XT1Jdn3Z3aWAdGjZnO7DXKlSlHw4AhzZ6UvvYpqaYUrCfLNaQMj5l/mBvH4kKe9yFEA+7ZLVNYjFSPfN+xN2yyxPk3NJfOTbKSadV4Ceu7Kn9gX7P+HYhVT7dmHYvY9tOaedQ5dS3Gfek3kONX9t5Kf1+Wj7hv8HG6k5s9m/BBEAH2PLQoZcXPOtmh5QX7lw6ZKLKlJfOl+3D9HLz4MJy/5bsaXYGNFNS8F16mprp0aZXuzaE39xt/x0F9NNfNWKFCEWfQz+N6r2/sRTG3NltOvk3o43Z2C8Z0x3X7jC76hT+wKY29OXff9Gq3Z9w9k6TI2U6dJrMfruXu9p3BinlEt3X7jPMjCNTgdvTlZPJvJ/iLJqXMpjf3e9s9lY6ePKkpPa/JRcaNDXSfOqy7uzejh+1t0PSRE2z2RL2P4jj3IWWMUdJGNyNvJqyKzNkr3Qu2VuTudU/c4+c7nxGlUCQUeSB1Vr7o/xhKjhIRLLaSKmJGu3ryCuFEhqWcR8aE1h3TLGUvpTNkTj6j/kD9q3z5DzT9/9FQBY+l3Q84nJNZ5FJD3R4V8R0Iu7WSGF9Ae2cJtqOsN6VlXsXKL6k5J67Y93n4z11+Z/bVc3y2m3Rg1HuXb+9+aMDzq13btJPjKUl6G/C3Iqd6UKvFt1ZZlYlGNbKm0d7CvKOp3dECYdfDIZ0V/Oem01BnSG09HW6enx8cdf/Z+HXu7qO8jfLZILKcFQ/LNuzgMsWf1ackVSn/c+vT2CjxX7UdVZa8sOv3dJW37XZh+KlJa6Yz1XNi/rRcTW7Yq9LbQxG4uKl6HN3I0e3jIJfH0hKcxlm3eCXGaVQFE+JYv62zKDFNVt+eGSxbntebEpQ5LebteNSW+ZC/3R8zDKP6XMW3+cKmJo7NlUa+6UHmqsrKlJxwHYKfzj6dJLsaLIjl1xQ7r7a8C1Wpp5CpfhftK8SqF6TA8/Wuy8JUrTHo3dpb3FfUOkYgn0SBTFVD0b7M6ZwU4K+pFZnZy/GJq6J9p3Qj/Lfe3fOkbB5J3Hh8CXzfwpfvRG2a/xKU36pUdW4+R+LKggCTmJyMCzJcYlPf6S/5GzrqKQHNL0+ZZEeM3G8Xqf4eDy7F8ky0IFVKBu2dXfCKqksVu8pnqMr/Zq95JdrT5dbGfxWWK6QeKz19t7vOeupgGgOcJ9CX8fePFx8v9fef5vV/V6c3G5mGxs9zSDz19hzk9+dTBuklZFJH2p/t8RKdLz/oK+rvnKA1Xs2k/dQN3lx8v5D6MdJ+M1F9RJR/n7iO16Fz5n4LbKjdJMH3EaJnSdpKKZZVJvzK+7U8VGbO1jnuQU1bYMaA9yYH1u5e1c4I8P3s3n0jJN6tOhRp39FKb7LjXLy+7G0YPrSfYEYu7R43VBNRJtWXkrGJ7hxfWJDm4dmP4EX4uIQLCRJMdJTNrzf5d9v1y4w6fErnEO8QeMtLGZbT7d/Ga0iLB1KzSDO/Y4Sca0lKmNw2Fy43E7m7NvIqNJTSBcQpCiOPhJx06T+U9qm/xdcmYfPTJkdM7Qkk/cH7J6L5dfY6dJV7/5lBTCMfn9t0eKYKM28L6sOhNzN8wjYV6kk5hTKJqlUvH2P9+hR2rDbMteFfM3UiUQYTlFLlH2lIUr+hvhQJl10Z/K2LdHuvdLeCkPD9o7YfGS7vYfrnMOqrz6o/1KEYWj7yHFOzHDdLaQe7XRjuQAoKs9L+yK8VaC/7F8Xn++VK2f8SJDfO5J8xN07cHjFJQ0QQlPdecaXr5eFc+Sk1TvSJBcYLBrLJFJ5DWSLI2Oqi3b8K6qOb3/BtxesPdnvOgFxT58Pqz3NfY9Dk/6vxmm+z79cXpd5Jh8JJD4Y7PmL8G5zRLj1c7jmnMaL8VEOhP9vz0s0v0a3uR/wdI6E0V4iOe9a8YpCcjUdfOvCMnLBJzYBOT8N5Pf4+55e5BFlRZQ/7TzXNfJeHr42T7nbyq9/V4gfXE1vNlT9ffGheBPnOZKRMDOTlSm4+Rh7jtktdx7H1mSHrmvTlH+h3T7XQkJzWN9VdOF+NKv8T+6s7PZ3vjnXXR5/zfzb8P8OxCdfgbhSh0AAAAASUVORK5CYII=";

interface ReportData {
  id: string;
  reportNumber: string;
  reportDate: string;
  projectLocation: string;
  reporter: string;
  managementSummary?: string;
  generalEvaluation?: string;
  findings: Finding[];
}

interface Finding {
  id: string;
  section: number;
  title: string;
  description: string;
  currentSituation?: string;
  dangerLevel: 'high' | 'medium' | 'low';
  recommendation?: string;
  images?: string[];
  location?: string;
  processSteps?: ProcessStep[];
  isCompleted?: boolean;
  status?: string;
}

interface ProcessStep {
  description: string;
  targetDate: string;
  responsible: string;
  status: string;
}

// Türkçe karakter desteği için font register etmeye çalışalım
try {
  Font.register({
    family: 'DejaVu Sans',
    fonts: [
      {
        src: 'https://fonts.gstatic.com/s/opensans/v18/mem8YaGs126MiZpBA-UFVZ0b.ttf',
      },
    ],
  });
} catch (e) {
  console.log('Font registration failed, using default font');
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: 'white',
    padding: 30,
    fontFamily: 'Times-Roman',
    fontSize: 10,
    lineHeight: 1.3,
  },
  
  // Cover Page Styles
  coverPage: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    padding: 40,
  },
  
  logo: {
    width: 160,
    height: 60,
    marginBottom: 30,
  },
  
  coverTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'Times-Bold',
  },
  
  coverSubtitle: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 30,
  },
  
  coverInfo: {
    width: '100%',
    maxWidth: 400,
    marginTop: 30,
  },
  
  coverInfoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: 8,
  },
  
  coverInfoLabel: {
    width: '45%',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e40af',
    fontFamily: 'Times-Bold',
  },
  
  coverInfoValue: {
    width: '55%',
    fontSize: 11,
    color: '#374151',
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 12,
    borderBottom: '2px solid #1e40af',
  },
  
  headerLogo: {
    width: 100,
    height: 38,
  },
  
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    fontFamily: 'Times-Bold',
  },
  
  // Section Styles
  sectionContainer: {
    marginBottom: 25,
  },
  
  sectionHeader: {
    backgroundColor: '#1e40af',
    color: 'white',
    padding: 12,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 15,
    fontFamily: 'Times-Bold',
  },
  
  sectionContent: {
    padding: 15,
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
  },
  
  // Finding Styles
  findingContainer: {
    marginBottom: 20,
    border: '1px solid #d1d5db',
    borderRadius: 6,
    overflow: 'hidden',
    pageBreakInside: false,
  },
  
  findingHeader: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderBottom: '1px solid #d1d5db',
  },
  
  findingTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
    fontFamily: 'Times-Bold',
  },
  
  findingMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  findingLocation: {
    fontSize: 9,
    color: '#6b7280',
  },
  
  riskBadge: {
    padding: '3 6',
    borderRadius: 3,
    fontSize: 8,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Times-Bold',
  },
  
  riskHigh: {
    backgroundColor: '#dc2626',
  },
  
  riskMedium: {
    backgroundColor: '#ea580c',
  },
  
  riskLow: {
    backgroundColor: '#16a34a',
  },
  
  findingContent: {
    padding: 12,
  },
  
  findingLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
    marginTop: 10,
    fontFamily: 'Times-Bold',
  },
  
  findingText: {
    fontSize: 9,
    lineHeight: 1.4,
    color: '#374151',
    textAlign: 'justify',
    marginBottom: 8,
  },
  
  // Process Steps
  processStepsContainer: {
    marginTop: 12,
  },
  
  processStep: {
    flexDirection: 'row',
    marginBottom: 6,
    padding: 6,
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 3,
  },
  
  processStepNumber: {
    width: 15,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1e40af',
    fontFamily: 'Times-Bold',
  },
  
  processStepContent: {
    flex: 1,
    fontSize: 8,
    color: '#374151',
  },
  
  processStepMeta: {
    fontSize: 7,
    color: '#6b7280',
    marginTop: 2,
  },
  
  // Footer Styles
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 8,
    color: '#6b7280',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 8,
  },
  
  pageNumber: {
    fontSize: 8,
    color: '#6b7280',
  },
  
  // Text Styles
  bodyText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#374151',
    textAlign: 'justify',
    marginBottom: 12,
  },
  
  summaryContainer: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    padding: 15,
    borderRadius: 6,
    marginBottom: 15,
  },
  
  // Liste için özel stil
  listText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#374151',
    marginBottom: 8,
  },
  
  // Başlık metinleri için
  titleText: {
    fontFamily: 'Times-Bold',
    fontWeight: 'bold',
  },
  
  coverFooter: {
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 20,
  },
});

// Logo component
const LogoComponent = ({ style }: { style?: any }) => (
  <Image 
    style={style} 
    src={`data:image/png;base64,${LOGO_BASE64}`}
  />
);

// Cover Page Component
const CoverPage = ({ reportData }: { reportData: ReportData }) => (
  <Page size="A4" style={styles.coverPage}>
    <View style={{ alignItems: 'center' }}>
      <LogoComponent style={styles.logo} />
      
      <Text style={[styles.coverTitle, styles.titleText]}>
        İŞ SAĞLIĞI VE GÜVENLİĞİ
      </Text>
      <Text style={[styles.coverTitle, styles.titleText]}>
        SAHA GÖZLEM RAPORU
      </Text>
      
      <Text style={styles.coverSubtitle}>
        {reportData.projectLocation}
      </Text>
    </View>

    <View style={styles.coverInfo}>
      <View style={styles.coverInfoRow}>
        <Text style={styles.coverInfoLabel}>Rapor Numarası:</Text>
        <Text style={styles.coverInfoValue}>{reportData.reportNumber}</Text>
      </View>
      
      <View style={styles.coverInfoRow}>
        <Text style={styles.coverInfoLabel}>Rapor Tarihi:</Text>
        <Text style={styles.coverInfoValue}>{reportData.reportDate}</Text>
      </View>
      
      <View style={styles.coverInfoRow}>
        <Text style={styles.coverInfoLabel}>Proje Lokasyonu:</Text>
        <Text style={styles.coverInfoValue}>{reportData.projectLocation}</Text>
      </View>
      
      <View style={styles.coverInfoRow}>
        <Text style={styles.coverInfoLabel}>İSG Uzmanı:</Text>
        <Text style={styles.coverInfoValue}>{reportData.reporter}</Text>
      </View>
      
      <View style={styles.coverInfoRow}>
        <Text style={styles.coverInfoLabel}>Toplam Bulgu:</Text>
        <Text style={styles.coverInfoValue}>{reportData.findings?.length || 0}</Text>
      </View>
    </View>

    <Text style={styles.coverFooter}>
      Bu rapor İş Sağlığı ve Güvenliği Kanunu kapsamında hazırlanmıştır.
    </Text>
  </Page>
);

// Header Component for content pages
const PageHeader = ({ title }: { title: string }) => (
  <View style={styles.header}>
    <LogoComponent style={styles.headerLogo} />
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

// Footer Component
const PageFooter = ({ pageNumber }: { pageNumber: number }) => (
  <View style={styles.footer}>
    <Text>MLPCARE Medical Park Hospital - İSG Raporu</Text>
    <Text style={styles.pageNumber}>Sayfa {pageNumber}</Text>
  </View>
);

// Section Components
const ManagementSummaryPage = ({ reportData }: { reportData: ReportData }) => (
  <Page size="A4" style={styles.page}>
    <PageHeader title="YÖNETİCİ ÖZETİ" />
    
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionHeader, styles.titleText]}>1. YÖNETİCİ ÖZETİ</Text>
      
      <View style={styles.summaryContainer}>
        <Text style={styles.bodyText}>
          {reportData.managementSummary || 
           'Bu rapor, işyerinde gerçekleştirilen İş Sağlığı ve Güvenliği denetimi sonucunda tespit edilen bulgular ve önerileri içermektedir. Raporda yer alan tespitlerin ivedilikle değerlendirilmesi ve gerekli önlemlerin alınması önerilmektedir.'}
        </Text>
      </View>
    </View>
    
    <PageFooter pageNumber={2} />
  </Page>
);

const RepairFindingsPage = ({ findings }: { findings: Finding[] }) => {
  const repairFindings = findings.filter(f => f.section === 1);
  
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="TAMİRAT-TADİLAT BULGULARI" />
      
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionHeader, styles.titleText]}>2. TAMİRAT-TADİLAT BULGULARI</Text>
        
        {repairFindings.length === 0 ? (
          <View style={styles.sectionContent}>
            <Text style={styles.bodyText}>Bu bölümde herhangi bir bulgu tespit edilmemiştir.</Text>
          </View>
        ) : (
          repairFindings.map((finding, index) => (
            <FindingComponent key={finding.id} finding={finding} findingNumber={index + 1} />
          ))
        )}
      </View>
      
      <PageFooter pageNumber={3} />
    </Page>
  );
};

const SafetyFindingsPage = ({ findings }: { findings: Finding[] }) => {
  const safetyFindings = findings.filter(f => f.section === 2 || f.section === 3);
  
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="İSG BULGULARI" />
      
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionHeader, styles.titleText]}>3. İŞ SAĞLIĞI VE GÜVENLİĞİ BULGULARI</Text>
        
        {safetyFindings.length === 0 ? (
          <View style={styles.sectionContent}>
            <Text style={styles.bodyText}>Bu bölümde herhangi bir bulgu tespit edilmemiştir.</Text>
          </View>
        ) : (
          safetyFindings.map((finding, index) => (
            <FindingComponent key={finding.id} finding={finding} findingNumber={index + 1} />
          ))
        )}
      </View>
      
      <PageFooter pageNumber={4} />
    </Page>
  );
};

const CompletedFindingsPage = ({ findings }: { findings: Finding[] }) => {
  const completedFindings = findings.filter(f => f.isCompleted || f.status === 'completed');
  
  return (
    <Page size="A4" style={styles.page}>
      <PageHeader title="TAMAMLANAN BULGULAR" />
      
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionHeader, styles.titleText]}>4. TAMAMLANAN BULGULAR</Text>
        
        {completedFindings.length === 0 ? (
          <View style={styles.sectionContent}>
            <Text style={styles.bodyText}>Henüz tamamlanan bulgu bulunmamaktadır.</Text>
          </View>
        ) : (
          completedFindings.map((finding, index) => (
            <FindingComponent key={finding.id} finding={finding} findingNumber={index + 1} />
          ))
        )}
      </View>
      
      <PageFooter pageNumber={5} />
    </Page>
  );
};

const GeneralEvaluationPage = ({ reportData }: { reportData: ReportData }) => (
  <Page size="A4" style={styles.page}>
    <PageHeader title="GENEL DEĞERLENDİRME" />
    
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionHeader, styles.titleText]}>5. GENEL DEĞERLENDİRME VE ÖNERİLER</Text>
      
      <View style={styles.sectionContent}>
        <Text style={styles.bodyText}>
          {reportData.generalEvaluation || 
           'Gerçekleştirilen İş Sağlığı ve Güvenliği denetimi sonucunda, işyerinde tespit edilen bulgular değerlendirilmiş ve gerekli öneriler sunulmuştur. Tüm tespitlerin mevzuat uygunluğu açısından değerlendirilmesi ve ivedilikle gerekli önlemlerin alınması önerilmektedir.'}
        </Text>
        
        <Text style={[styles.findingLabel, styles.titleText]}>Genel Öneriler:</Text>
        <Text style={styles.listText}>
          • İş Sağlığı ve Güvenliği mevzuatına tam uyum sağlanmalıdır.
        </Text>
        <Text style={styles.listText}>
          • Çalışanlara düzenli eğitimler verilmelidir.
        </Text>
        <Text style={styles.listText}>
          • Risk değerlendirmesi güncel tutulmalıdır.
        </Text>
        <Text style={styles.listText}>
          • Periyodik kontroller aksatılmamalıdır.
        </Text>
      </View>
    </View>
    
    <PageFooter pageNumber={6} />
  </Page>
);

// Finding Component
const FindingComponent = ({ finding, findingNumber }: { finding: Finding; findingNumber: number }) => {
  const getRiskStyle = (level: string) => {
    switch (level) {
      case 'high': return [styles.riskBadge, styles.riskHigh];
      case 'medium': return [styles.riskBadge, styles.riskMedium];
      case 'low': return [styles.riskBadge, styles.riskLow];
      default: return [styles.riskBadge, styles.riskMedium];
    }
  };

  const getRiskText = (level: string) => {
    switch (level) {
      case 'high': return 'YÜKSEK RİSK';
      case 'medium': return 'ORTA RİSK';
      case 'low': return 'DÜŞÜK RİSK';
      default: return 'ORTA RİSK';
    }
  };

  return (
    <View style={styles.findingContainer}>
      <View style={styles.findingHeader}>
        <Text style={styles.findingTitle}>
          BULGU {findingNumber}: {finding.title}
        </Text>
        <View style={styles.findingMeta}>
          <Text style={styles.findingLocation}>
            Konum: {finding.location || 'Belirtilmemiş'}
          </Text>
          <View style={getRiskStyle(finding.dangerLevel)}>
            <Text style={{ color: 'white' }}>{getRiskText(finding.dangerLevel)}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.findingContent}>
        <Text style={[styles.findingLabel, styles.titleText]}>Mevcut Durum:</Text>
        <Text style={styles.findingText}>
          {finding.currentSituation || finding.description}
        </Text>
        
        {finding.recommendation && (
          <>
            <Text style={[styles.findingLabel, styles.titleText]}>Öneri/Çözüm:</Text>
            <Text style={styles.findingText}>{finding.recommendation}</Text>
          </>
        )}
        
        {finding.processSteps && finding.processSteps.length > 0 && (
          <View style={styles.processStepsContainer}>
            <Text style={[styles.findingLabel, styles.titleText]}>Süreç Yönetimi:</Text>
            {finding.processSteps.map((step, index) => (
              <View key={index} style={styles.processStep}>
                <Text style={styles.processStepNumber}>{index + 1}.</Text>
                <View style={styles.processStepContent}>
                  <Text style={{ fontSize: 8 }}>{step.description}</Text>
                  <Text style={styles.processStepMeta}>
                    Sorumlu: {step.responsible} | Hedef: {step.targetDate} | Durum: {step.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
        
        {finding.images && finding.images.length > 0 && (
          <>
            <Text style={[styles.findingLabel, styles.titleText]}>Ekteki Fotoğraflar:</Text>
            <Text style={styles.findingText}>
              Bu bulguya ait {finding.images.length} adet fotoğraf raporda mevcuttur.
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

// Main Document Component
const ReportDocument = ({ reportData }: { reportData: ReportData }) => (
  <Document>
    <CoverPage reportData={reportData} />
    <ManagementSummaryPage reportData={reportData} />
    <RepairFindingsPage findings={reportData.findings || []} />
    <SafetyFindingsPage findings={reportData.findings || []} />
    <CompletedFindingsPage findings={reportData.findings || []} />
    <GeneralEvaluationPage reportData={reportData} />
  </Document>
);

export class ReactPdfService {
  async generatePDF(reportData: ReportData): Promise<Uint8Array> {
    try {
      console.log('Generating PDF for report:', reportData.reportNumber);
      
      // Türkçe karakterlerin düzgün işlenmesini sağla
      const processedData = {
        ...reportData,
        reportDate: typeof reportData.reportDate === 'string' 
          ? reportData.reportDate 
          : new Date(reportData.reportDate).toLocaleDateString('tr-TR'),
        findings: (reportData.findings || []).map(finding => ({
          ...finding,
          title: finding.title || 'Başlıksız Bulgu',
          description: finding.description || finding.currentSituation || 'Açıklama girilmemiş',
          location: finding.location || finding.title || 'Belirtilmemiş',
          processSteps: finding.processSteps || [],
          images: finding.images || []
        }))
      };

      const pdfBuffer = await renderToBuffer(
        <ReportDocument reportData={processedData} />
      );
      
      console.log('PDF generated successfully, size:', pdfBuffer.length);
      return new Uint8Array(pdfBuffer);
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`PDF oluşturulurken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }
}