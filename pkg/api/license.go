package api

import (
	"github.com/grafana/grafana/pkg/api/dtos"
	// "github.com/grafana/grafana/pkg/bus"
	// "github.com/grafana/grafana/pkg/events"
	// "github.com/grafana/grafana/pkg/infra/metrics"
	m "github.com/grafana/grafana/pkg/models"
	// "github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/services/license"
	"github.com/grafana/grafana/pkg/util"
)

// GET /license/information
func GetLicenseInfo(c *m.ReqContext) Response {
	return JSON(200, util.DynMap{
		"授权状态": license.VerifyLicense(),
	})
}

// GET /license/informationverbose
func GetLicenseInfoVerbose(c *m.ReqContext) Response {
	return JSON(200, util.DynMap{
		"单位":     license.GetLicenseCompany(),
		"授权码":    license.GetLicenseKey(),
		"安装ID":   license.GetInstallID(),
		"激活时间":   license.GetCreateTime(),
		"授权天数":   license.GetExpire(),
		"集群规模":   license.GetScale(),
		"实际安装ID": license.GetActualID(),
		"实际规模":   license.GetActualScale(),
		"系统时间":   license.GetCurrentTime(),
	})
}

// POST /license/information
func SetLicenseInfo(c *m.ReqContext, form dtos.LicenseInput) Response {
	//  = form.Company
	// licenseGlobal.key = form.Key
	license.UpdateLicense(form.Key)

	return JSON(200, util.DynMap{"status": "授权信息更新成功"})
}

// POST /api/user/signup
// func SignUp(c *m.ReqContext, form dtos.SignUpForm) Response {
// 	if !setting.AllowUserSignUp {
// 		return Error(401, "User signup is disabled", nil)
// 	}

// 	existing := m.GetUserByLoginQuery{LoginOrEmail: form.Email}
// 	if err := bus.Dispatch(&existing); err == nil {
// 		return Error(422, "User with same email address already exists", nil)
// 	}

// 	cmd := m.CreateTempUserCommand{}
// 	cmd.OrgId = -1
// 	cmd.Email = form.Email
// 	cmd.Status = m.TmpUserSignUpStarted
// 	cmd.InvitedByUserId = c.UserId
// 	cmd.Code = util.GetRandomString(20)
// 	cmd.RemoteAddr = c.Req.RemoteAddr

// 	if err := bus.Dispatch(&cmd); err != nil {
// 		return Error(500, "Failed to create signup", err)
// 	}

// 	bus.Publish(&events.SignUpStarted{
// 		Email: form.Email,
// 		Code:  cmd.Code,
// 	})

// 	metrics.M_Api_User_SignUpStarted.Inc()

// 	return JSON(200, util.DynMap{"status": "SignUpCreated"})
// }
