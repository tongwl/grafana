package license

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"math/big"
	"net/http"
	"os"
	"time"

	"github.com/grafana/grafana/pkg/log"
	"github.com/grafana/grafana/pkg/registry"
	"github.com/grafana/grafana/pkg/setting"
	"golang.org/x/sync/errgroup"
)

import "C"

var (
	ErrDataToLarge     = errors.New("message too long for RSA public key size")
	ErrDataLen         = errors.New("data length error")
	ErrDataBroken      = errors.New("data broken, first byte is not zero")
	ErrKeyPairDismatch = errors.New("data is not encrypted by the private key")
	ErrDecryption      = errors.New("decryption error")
	ErrPublicKey       = errors.New("get public key error")
	ErrPrivateKey      = errors.New("get private key error")
)

type LicenseFile struct {
	Key string `json:"授权码"`
}

type LicenseContent struct {
	Company    string `json:"单位"`
	InstallID  string `json:"安装ID"`
	CreateTime int64  `json:"起始时间"`
	Days       int64  `json:"使用天数"`
	Scale      int64  `json:"集群规模"`
}

type LicenseInfo struct {
	origin     LicenseFile
	verbose    LicenseContent
	loadstatus int
	actualID   string
	// TODO actual scale
	actualScale int64
}

var licenseGlobal LicenseInfo

type LicenseService struct {
}

func init() {
	registry.RegisterService(&LicenseService{})
}

func (e *LicenseService) Init() error {
	LoadFile()
	return nil
}

var logger = log.New("license service")

func SaveFile() {
	filePath := setting.HomePath + "\\chenqi.lic"
	//1、打开文件
	file, err := os.OpenFile(filePath, os.O_RDWR|os.O_TRUNC|os.O_CREATE, 0644)
	defer file.Close()
	if nil != err {
		logger.Info("Open license file failed", "error", err)
		return
	}
	// 3、写入数据
	//os.Truncate(filePath, 0) //clear
	// data := []byte{115, 111, 109, 101, 10}
	data, err := json.Marshal(licenseGlobal.origin)
	if err != nil {
		logger.Info("license: 生成json字符串错误", "error", err)
		return
	}

	err = ioutil.WriteFile(filePath, data, 066)
	if nil != err {
		logger.Info("Write license file failed", "error", err)
		return
	}
}

func UpdateLicense(k string) {
	licenseGlobal.origin.Key = k
	SaveFile()
	updateFromFile(licenseGlobal.origin)
}

func updateFromFile(licenseFile LicenseFile) {
	licenseGlobal.verbose = LicenseContent{}
	licenseKeyBytes, err := base64.StdEncoding.DecodeString(licenseFile.Key)
	if err != nil {
		fmt.Println("DecodeString Failed", err.Error())
		licenseGlobal.loadstatus = -3
		return
	}

	key := "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwIf+c/301BmIRMh076b+b8ToXVIYxXtL3Ozs3bRgp64mPoZaaLssUBRCdEWell5GER6buz5lUvmZIjV1VsGIuNOYQBPNgxJpOjBsS+5R4ve3F34JNSN0pqe1Ds8tUmZ1bzvaydCnqv/tCX56vTQzGmEEg5jm81VzwWUMymxVMjejmE2BM5BdGBVMeo4CN2JpRSTec//exNbPqXwjX8JBxgFFkNCD101wEidrLsAF4gPHIEu11zTvQwEtYa18WdA8C7MN1M4nic1RoAqdGJupbUDipTuyMYlDYrlPlFlhD49jPxXJtko+fa8Qbk1LSTEqiPFz9BaKi2hURJn9zuRFawIDAQAB"

	bytes, _ := base64.StdEncoding.DecodeString(key)
	pubKey, err := x509.ParsePKIXPublicKey(bytes)
	if err != nil {
		licenseGlobal.loadstatus = -4
		return
	}
	pub := pubKey.(*rsa.PublicKey)
	decrypted, _ := pubKeyDecrypt(pub, licenseKeyBytes)

	//fmt.Println(string(decrypted))

	licenseContent := &LicenseContent{}
	err = json.Unmarshal(decrypted, &licenseContent)

	if err != nil {
		licenseGlobal.loadstatus = -5
		fmt.Println("Unmarshal Failed", err.Error())
		return
	}
	licenseGlobal.loadstatus = 0
	licenseGlobal.verbose = *licenseContent
}

func LoadFile() {
	data, err := ioutil.ReadFile(setting.HomePath + "\\chenqi.lic")
	if err != nil {
		logger.Info("Read license file failed", "error", err)
		licenseGlobal.loadstatus = -1
		return
	}
	licenseFile := &LicenseFile{}
	err = json.Unmarshal(data, &licenseFile)
	if err != nil {
		logger.Info("Read license file content failed", "error", err)
		licenseGlobal.loadstatus = -2
		return
	}
	licenseGlobal.origin = *licenseFile
	updateFromFile(*licenseFile)
}

type Cluster struct {
	Scale     int64  `json:"scale"`
	InstallId string `json:"installID"`
}

func (e *LicenseService) TmrTick(grafanaCtx context.Context) error {
	t1 := time.Tick(10 * time.Second)
	for {
		select {
		case <-t1:
			c := installIDGet()
			licenseGlobal.actualID = c.InstallId
			licenseGlobal.actualScale = c.Scale
		}
	}
}

//TODO exporter get installation implementation
func installIDGet() *Cluster {
	resp, err := http.Get("http://127.0.0.1:9191/cluster")
	if err != nil {
		// handle error
		return &Cluster{0, "获取集群信息失败"}
	}

	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		// handle error
		return &Cluster{0, "读取集群信息失败"}
	}

	cluster := &Cluster{}
	err = json.Unmarshal(body, &cluster)
	if err != nil {
		return &Cluster{0, "解析集群信息失败"}
	}
	return cluster
}

func GetLicenseCompany() string {
	return licenseGlobal.verbose.Company
}

func GetCurrentTime() int64 {
	return time.Now().Unix()
}

func GetCreateTime() int64 {
	return licenseGlobal.verbose.CreateTime
}

func GetLicenseKey() string {
	return licenseGlobal.origin.Key
}

func GetInstallID() string {
	return licenseGlobal.verbose.InstallID
}

func GetExpire() int64 {
	return licenseGlobal.verbose.Days
}

func GetScale() int64 {
	return licenseGlobal.verbose.Scale
}

func GetActualScale() int64 {
	return licenseGlobal.actualScale
}

func GetActualID() string {
	return licenseGlobal.actualID
}

func (e *LicenseService) Run(ctx context.Context) error {

	tmrGroup, ctx := errgroup.WithContext(ctx)
	tmrGroup.Go(func() error { return e.TmrTick(ctx) })
	err := tmrGroup.Wait()
	return err
}

//截取字符串 start 起点下标 end 终点下标(不包括)
func Substr(str string, start int, end int) string {
	rs := []rune(str)
	length := len(rs)

	if start < 0 || start > length {
		panic("start is wrong")
	}

	if end < 0 || end > length {
		panic("end is wrong")
	}

	return string(rs[start:end])
}

//go build -x -v -ldflags "-s -w" -buildmode=c-archive -o license.a GoServerLicense.go

//export VerifyLicense
func VerifyLicense() string {
	if licenseGlobal.loadstatus == -1 {
		return "加载授权信息失败"
	}
	if licenseGlobal.loadstatus < 0 {
		return "授权信息解析失败"
	}
	if (licenseGlobal.verbose.CreateTime + licenseGlobal.verbose.Days*86400) < time.Now().Unix() {
		return "授权信息过期"
	}
	if (licenseGlobal.verbose.InstallID != licenseGlobal.actualID) && licenseGlobal.actualID != "" {
		return "安装集群不符"
	}
	if licenseGlobal.verbose.Scale < licenseGlobal.actualScale && licenseGlobal.actualScale > 0 {
		return "集群规模不符"
	}

	return "授权信息正常"
}

/*私钥加密*/
func priKeyEncrypt(rand io.Reader, priv *rsa.PrivateKey, hashed []byte) ([]byte, error) {
	tLen := len(hashed)
	k := (priv.N.BitLen() + 7) / 8
	if k < tLen+11 {
		return nil, ErrDataLen
	}
	em := make([]byte, k)
	em[1] = 1
	for i := 2; i < k-tLen-1; i++ {
		em[i] = 0xff
	}
	copy(em[k-tLen:k], hashed)
	m := new(big.Int).SetBytes(em)
	c, err := decrypt(rand, priv, m)
	if err != nil {
		return nil, err
	}
	copyWithLeftPad(em, c.Bytes())
	return em, nil
}

// 加密
func RsaEncrypt(origData []byte, key []byte) ([]byte, error) {
	block, _ := pem.Decode(key)
	if block == nil {
		return nil, errors.New("key error")
	}
	pubInterface, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return nil, err
	}
	pub := pubInterface.(*rsa.PublicKey)
	return rsa.EncryptPKCS1v15(rand.Reader, pub, origData)
}

// 解密
func RsaDecrypt(ciphertext []byte, key []byte) ([]byte, error) {
	block, _ := pem.Decode(key)
	if block == nil {
		return nil, errors.New("key error!")
	}
	priv, err := x509.ParsePKCS1PrivateKey(block.Bytes)

	if err != nil {
		return nil, err
	}

	return rsa.DecryptPKCS1v15(rand.Reader, priv, ciphertext)
}

func GenRsaKey(bits int) error {
	// 生成私钥文件
	privateKey, err := rsa.GenerateKey(rand.Reader, bits)
	if err != nil {
		return err
	}
	derStream := x509.MarshalPKCS1PrivateKey(privateKey)
	block := &pem.Block{
		Type:  "私钥",
		Bytes: derStream,
	}
	file, err := os.Create("private.pem")
	if err != nil {
		return err
	}
	err = pem.Encode(file, block)
	if err != nil {
		return err
	}
	// 生成公钥文件
	publicKey := &privateKey.PublicKey
	derPkix, err := x509.MarshalPKIXPublicKey(publicKey)
	if err != nil {
		return err
	}
	block = &pem.Block{
		Type:  "公钥",
		Bytes: derPkix,
	}
	file, err = os.Create("public.pem")
	if err != nil {
		return err
	}
	err = pem.Encode(file, block)
	if err != nil {
		return err
	}
	return nil
}

/*公钥解密*/
func pubKeyDecrypt(pub *rsa.PublicKey, data []byte) ([]byte, error) {
	k := (pub.N.BitLen() + 7) / 8
	if k != len(data) {
		return nil, ErrDataLen
	}
	m := new(big.Int).SetBytes(data)
	if m.Cmp(pub.N) > 0 {
		return nil, ErrDataToLarge
	}
	m.Exp(m, big.NewInt(int64(pub.E)), pub.N)
	d := leftPad(m.Bytes(), k)
	if d[0] != 0 {
		return nil, ErrDataBroken
	}
	if d[1] != 0 && d[1] != 1 {
		return nil, ErrKeyPairDismatch
	}
	var i = 2
	for ; i < len(d); i++ {
		if d[i] == 0 {
			break
		}
	}
	i++
	if i == len(d) {
		return nil, nil
	}
	return d[i:], nil
}

/*公钥加密或解密Reader*/
func pubKeyIO(pub *rsa.PublicKey, in io.Reader, out io.Writer, isEncrytp bool) error {
	k := (pub.N.BitLen() + 7) / 8
	if isEncrytp {
		k = k - 11
	}
	buf := make([]byte, k)
	var b []byte
	var err error
	size := 0
	for {
		size, err = in.Read(buf)
		if err != nil {
			if err == io.EOF {
				return nil
			}
			return err
		}
		if size < k {
			b = buf[:size]
		} else {
			b = buf
		}
		if isEncrytp {
			b, err = rsa.EncryptPKCS1v15(rand.Reader, pub, b)
		} else {
			b, err = pubKeyDecrypt(pub, b)
		}
		if err != nil {
			return err
		}
		if _, err = out.Write(b); err != nil {
			return err
		}
	}
	return nil
}

/*私钥加密或解密Reader*/
func priKeyIO(pri *rsa.PrivateKey, r io.Reader, w io.Writer, isEncrytp bool) error {
	k := (pri.N.BitLen() + 7) / 8
	if isEncrytp {
		k = k - 11
	}
	buf := make([]byte, k)
	var err error
	var b []byte
	size := 0
	for {
		size, err = r.Read(buf)
		if err != nil {
			if err == io.EOF {
				return nil
			}
			return err
		}
		if size < k {
			b = buf[:size]
		} else {
			b = buf
		}
		if isEncrytp {
			b, err = priKeyEncrypt(rand.Reader, pri, b)
		} else {
			b, err = rsa.DecryptPKCS1v15(rand.Reader, pri, b)
		}

		if err != nil {
			return err
		}
		if _, err = w.Write(b); err != nil {
			return err
		}
	}
	return nil
}

/*公钥加密或解密byte*/
func pubKeyByte(pub *rsa.PublicKey, in []byte, isEncrytp bool) ([]byte, error) {
	k := (pub.N.BitLen() + 7) / 8
	if isEncrytp {
		k = k - 11
	}
	if len(in) <= k {
		if isEncrytp {
			return rsa.EncryptPKCS1v15(rand.Reader, pub, in)
		} else {
			return pubKeyDecrypt(pub, in)
		}
	} else {
		iv := make([]byte, k)
		out := bytes.NewBuffer(iv)
		if err := pubKeyIO(pub, bytes.NewReader(in), out, isEncrytp); err != nil {
			return nil, err
		}
		return ioutil.ReadAll(out)
	}
}

/*私钥加密或解密byte*/
func priKeyByte(pri *rsa.PrivateKey, in []byte, isEncrytp bool) ([]byte, error) {
	k := (pri.N.BitLen() + 7) / 8
	if isEncrytp {
		k = k - 11
	}
	if len(in) <= k {
		if isEncrytp {
			return priKeyEncrypt(rand.Reader, pri, in)
		} else {
			return rsa.DecryptPKCS1v15(rand.Reader, pri, in)
		}
	} else {
		iv := make([]byte, k)
		out := bytes.NewBuffer(iv)
		if err := priKeyIO(pri, bytes.NewReader(in), out, isEncrytp); err != nil {
			return nil, err
		}
		return ioutil.ReadAll(out)
	}
}

var pemStart = []byte("-----BEGIN ")

/*读取公钥*/
//公钥可以没有如 -----BEGIN PUBLIC KEY-----的前缀后缀
func getPubKey(in []byte) (*rsa.PublicKey, error) {
	var pubKeyBytes []byte
	if bytes.HasPrefix(in, pemStart) {
		block, _ := pem.Decode(in)
		if block == nil {
			return nil, ErrPublicKey
		}
		pubKeyBytes = block.Bytes
	} else {
		var err error
		pubKeyBytes, err = base64.StdEncoding.DecodeString(string(in))
		if err != nil {
			return nil, ErrPublicKey
		}
	}

	pub, err := x509.ParsePKIXPublicKey(pubKeyBytes)
	if err != nil {
		return nil, err
	} else {
		return pub.(*rsa.PublicKey), err
	}

}

/*读取私钥*/
func getPriKey(in []byte) (*rsa.PrivateKey, error) {
	block, _ := pem.Decode(in)
	if block == nil {
		return nil, ErrPrivateKey
	}
	pri, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err == nil {
		return pri, nil
	}
	pri2, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, err
	} else {
		return pri2.(*rsa.PrivateKey), nil
	}
}

/*从crypto/rsa复制 */
var bigZero = big.NewInt(0)
var bigOne = big.NewInt(1)

/*从crypto/rsa复制 */
func encrypt(c *big.Int, pub *rsa.PublicKey, m *big.Int) *big.Int {
	e := big.NewInt(int64(pub.E))
	c.Exp(m, e, pub.N)
	return c
}

/*从crypto/rsa复制 */
func decrypt(random io.Reader, priv *rsa.PrivateKey, c *big.Int) (m *big.Int, err error) {
	if c.Cmp(priv.N) > 0 {
		err = ErrDecryption
		return
	}
	var ir *big.Int
	if random != nil {
		var r *big.Int

		for {
			r, err = rand.Int(random, priv.N)
			if err != nil {
				return
			}
			if r.Cmp(bigZero) == 0 {
				r = bigOne
			}
			var ok bool
			ir, ok = modInverse(r, priv.N)
			if ok {
				break
			}
		}
		bigE := big.NewInt(int64(priv.E))
		rpowe := new(big.Int).Exp(r, bigE, priv.N)
		cCopy := new(big.Int).Set(c)
		cCopy.Mul(cCopy, rpowe)
		cCopy.Mod(cCopy, priv.N)
		c = cCopy
	}

	if priv.Precomputed.Dp == nil {
		m = new(big.Int).Exp(c, priv.D, priv.N)
	} else {
		m = new(big.Int).Exp(c, priv.Precomputed.Dp, priv.Primes[0])
		m2 := new(big.Int).Exp(c, priv.Precomputed.Dq, priv.Primes[1])
		m.Sub(m, m2)
		if m.Sign() < 0 {
			m.Add(m, priv.Primes[0])
		}
		m.Mul(m, priv.Precomputed.Qinv)
		m.Mod(m, priv.Primes[0])
		m.Mul(m, priv.Primes[1])
		m.Add(m, m2)

		for i, values := range priv.Precomputed.CRTValues {
			prime := priv.Primes[2+i]
			m2.Exp(c, values.Exp, prime)
			m2.Sub(m2, m)
			m2.Mul(m2, values.Coeff)
			m2.Mod(m2, prime)
			if m2.Sign() < 0 {
				m2.Add(m2, prime)
			}
			m2.Mul(m2, values.R)
			m.Add(m, m2)
		}
	}
	if ir != nil {
		m.Mul(m, ir)
		m.Mod(m, priv.N)
	}

	return
}

/*从crypto/rsa复制 */
func copyWithLeftPad(dest, src []byte) {
	numPaddingBytes := len(dest) - len(src)
	for i := 0; i < numPaddingBytes; i++ {
		dest[i] = 0
	}
	copy(dest[numPaddingBytes:], src)
}

/*从crypto/rsa复制 */
func nonZeroRandomBytes(s []byte, rand io.Reader) (err error) {
	_, err = io.ReadFull(rand, s)
	if err != nil {
		return
	}
	for i := 0; i < len(s); i++ {
		for s[i] == 0 {
			_, err = io.ReadFull(rand, s[i:i+1])
			if err != nil {
				return
			}
			s[i] ^= 0x42
		}
	}
	return
}

/*从crypto/rsa复制 */
func leftPad(input []byte, size int) (out []byte) {
	n := len(input)
	if n > size {
		n = size
	}
	out = make([]byte, size)
	copy(out[len(out)-n:], input)
	return
}

/*从crypto/rsa复制 */
func modInverse(a, n *big.Int) (ia *big.Int, ok bool) {
	g := new(big.Int)
	x := new(big.Int)
	y := new(big.Int)
	g.GCD(x, y, a, n)
	if g.Cmp(bigOne) != 0 {
		return
	}
	if x.Cmp(bigOne) < 0 {
		x.Add(x, n)
	}
	return x, true
}
